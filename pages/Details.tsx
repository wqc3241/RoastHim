
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppUser, RoastTarget, RoastComment, RoastType } from '../types';
import { supabase } from '../supabaseClient';
import { applyProgress, EXP_RULES, syncBadges } from '../utils/progression';
import { containsProfanity } from '../utils/moderation';
import { t } from '../utils/i18n';

interface Props {
  target: RoastTarget;
  onBack: () => void;
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  onRequireLogin?: () => void;
}

const Details: React.FC<Props> = ({ target, onBack, currentUser, isAuthenticated, onRequireLogin }) => {
  const [roasts, setRoasts] = useState<RoastComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [isLoading, setIsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [showTranscriptIds, setShowTranscriptIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<RoastComment | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());
  const [targetStats, setTargetStats] = useState({
    roastCount: target.roastCount ?? 0,
    totalLikes: target.totalLikes ?? 0
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileUser, setProfileUser] = useState<{
    id: string;
    name: string;
    avatar: string;
    quote?: string;
    level?: number;
  } | null>(null);

  const sortedRoasts = useMemo(() => {
    const items = [...roasts];
    if (sort === 'hot') {
      return items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return items.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [roasts, sort]);

  const mainComments = useMemo(
    () => sortedRoasts.filter((roast) => !roast.replyToCommentId),
    [sortedRoasts]
  );
  const replyMap = useMemo(() => {
    const map: Record<string, RoastComment[]> = {};
    sortedRoasts
      .filter((roast) => roast.replyToCommentId)
      .forEach((reply) => {
        const parentId = reply.replyToCommentId as string;
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(reply);
      });
    return map;
  }, [sortedRoasts]);

  useEffect(() => {
    const loadRoasts = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const query = supabase
        .from('roast_comments')
        .select('*')
        .eq('targetId', target.id);

      if (sort === 'hot') {
        query.order('likes', { ascending: false });
      } else {
        query.order('createdAt', { ascending: false });
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setIsLoading(false);
        return;
      }

      const nextRoasts = data as RoastComment[];
      setRoasts(nextRoasts);
      const derivedLikes = nextRoasts.reduce((sum, roast) => sum + (roast.likes ?? 0), 0);
      setTargetStats({
        roastCount: nextRoasts.length,
        totalLikes: derivedLikes
      });
      setIsLoading(false);
    };

    loadRoasts();
  }, [target.id, sort]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [audioPreviewUrl]);

  const persistComment = async (newRoast: RoastComment) => {
    setRoasts([newRoast, ...roasts]);
    setTargetStats((prev) => ({
      roastCount: prev.roastCount + 1,
      totalLikes: prev.totalLikes
    }));

    if (supabase) {
      await supabase.from('roast_comments').insert([newRoast]);
      await applyProgress({
        userId: currentUser!.id,
        roastsPosted: 1,
        exp: EXP_RULES.comment
      });
      await syncBadges(currentUser!.id);
      const { data: targetRow } = await supabase
        .from('roast_targets')
        .select('roastCount,totalLikes')
        .eq('id', target.id)
        .maybeSingle();
      await supabase
        .from('roast_targets')
        .update({
          roastCount: (targetRow?.roastCount ?? 0) + 1
        })
        .eq('id', target.id);

      if (target.creatorId && target.creatorId !== currentUser!.id) {
        await supabase.from('notifications').insert([{
          userId: target.creatorId,
          type: 'comment',
          targetId: target.id,
          commentId: newRoast.id,
          actorId: currentUser!.id,
          actorName: currentUser!.name
        }]);
      }

      if (newRoast.replyToUserId && newRoast.replyToUserId !== currentUser!.id) {
        await supabase.from('notifications').insert([{
          userId: newRoast.replyToUserId,
          type: 'comment',
          targetId: target.id,
          commentId: newRoast.id,
          actorId: currentUser!.id,
          actorName: currentUser!.name
        }]);
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!currentUser) return;
    if (containsProfanity(inputText)) {
      setTextError(t('details_text_profanity'));
      return;
    }
    const replyTarget = replyingTo;
    const newRoast: RoastComment = {
      id: Date.now().toString(),
      targetId: target.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: inputText,
      type: 'text',
      likes: 0,
      isChampion: false,
      timestamp: t('messages_just_now'),
      replyToCommentId: replyTarget?.id,
      replyToUserId: replyTarget?.userId,
      replyToUserName: replyTarget?.userName
    };
    setInputText('');
    setTextError(null);
    setReplyingTo(null);
    await persistComment(newRoast);
  };

  const handleVoiceToggle = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAudioError(t('details_audio_unsupported'));
      return;
    }
    if (!window.MediaRecorder) {
      setAudioError(t('details_audio_unsupported'));
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (isRecording) {
      recorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecognizing(false);
      setIsRecording(false);
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    audioChunksRef.current = [];
    setAudioError(null);
    setAudioTranscript('');
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioPreviewUrl(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);

    const recognition = new SpeechRecognition();
    const isZh = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh');
    recognition.lang = isZh ? 'zh-CN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        }
      }
      if (finalText.trim()) {
        setAudioTranscript((prev) => `${prev}${prev ? ' ' : ''}${finalText.trim()}`);
      }
    };
    recognition.onerror = () => {
      setIsRecognizing(false);
    };
    recognition.onend = () => {
      setIsRecognizing(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecognizing(true);
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !currentUser || !supabase) return;
    if (audioBlob.size === 0) {
      setAudioError(t('details_audio_empty'));
      return;
    }
    if (audioTranscript && containsProfanity(audioTranscript)) {
      setAudioError(t('details_transcript_profanity'));
      return;
    }
    const roastId = Date.now().toString();
    const path = `${currentUser.id}/${roastId}.webm`;
    const file = new File([audioBlob], `${roastId}.webm`, {
      type: audioBlob.type || 'audio/webm'
    });
    const { error } = await supabase.storage
      .from('roast-audio')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setAudioError(t('details_audio_upload_failed'));
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('roast-audio')
      .getPublicUrl(path);

    const newRoast: RoastComment = {
      id: roastId,
      targetId: target.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: audioTranscript || t('details_audio_comment_label'),
      type: 'audio',
      mediaUrl: publicUrl.publicUrl,
      transcript: audioTranscript,
      likes: 0,
      isChampion: false,
      timestamp: t('messages_just_now'),
      replyToCommentId: replyingTo?.id,
      replyToUserId: replyingTo?.userId,
      replyToUserName: replyingTo?.userName
    };
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setAudioTranscript('');
    setReplyingTo(null);
    setAudioError(null);
    await persistComment(newRoast);
  };

  const handleLike = async (roastId: string) => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    if (likedIds.has(roastId)) return;
    const current = roasts.find((roast) => roast.id === roastId);
    const nextLikes = (current?.likes ?? 0) + 1;

    setLikedIds((prev) => new Set(prev).add(roastId));
    const optimisticRoasts = roasts.map((roast) =>
      roast.id === roastId ? { ...roast, likes: nextLikes } : roast
    );
    setRoasts(optimisticRoasts);
    const optimisticTotalLikes = optimisticRoasts.reduce(
      (sum, roast) => sum + (roast.likes ?? 0),
      0
    );
    setTargetStats((prev) => ({
      roastCount: prev.roastCount,
      totalLikes: optimisticTotalLikes
    }));

    if (supabase) {
      const { error: likeError } = await supabase
        .from('roast_comments')
        .update({ likes: nextLikes })
        .eq('id', roastId);

      if (likeError) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(roastId);
          return next;
        });
        setRoasts(roasts);
        setTargetStats((prev) => ({
          roastCount: prev.roastCount,
          totalLikes: roasts.reduce((sum, roast) => sum + (roast.likes ?? 0), 0)
        }));
        return;
      }

      const { data: likeRows, error: sumError } = await supabase
        .from('roast_comments')
        .select('likes')
        .eq('targetId', target.id);
      const totalLikes = Array.isArray(likeRows)
        ? likeRows.reduce((sum, row: any) => sum + (row.likes ?? 0), 0)
        : optimisticTotalLikes;

      if (!sumError) {
        setTargetStats((prev) => ({
          roastCount: prev.roastCount,
          totalLikes
        }));
        await supabase
          .from('roast_targets')
          .update({
            roastCount: roasts.length,
            totalLikes
          })
          .eq('id', target.id);

        if (currentUser) {
          await applyProgress({
            userId: currentUser.id,
            exp: EXP_RULES.like
          });
          await syncBadges(currentUser.id);
        }

        if (current?.userId && currentUser && current.userId !== currentUser.id) {
          await applyProgress({
            userId: current.userId,
            likesReceived: 1,
            exp: EXP_RULES.receivedLike
          });
          await supabase.from('notifications').insert([{
            userId: current.userId,
            type: 'like',
            targetId: target.id,
            commentId: roastId,
            actorId: currentUser.id,
            actorName: currentUser.name
          }]);
        }
      }
    }
  };

  const toggleTranscript = (roastId: string) => {
    setShowTranscriptIds((prev) => {
      const next = new Set(prev);
      if (next.has(roastId)) {
        next.delete(roastId);
      } else {
        next.add(roastId);
      }
      return next;
    });
  };

  const toggleReplies = (parentId: string) => {
    setExpandedReplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const handleOpenProfile = async (roast: RoastComment) => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    setIsProfileModalOpen(true);
    setProfileLoading(true);
    setProfileUser(null);

    if (supabase && roast.userId) {
      const { data } = await supabase
        .from('public_users')
        .select('id,name,avatar,quote,level')
        .eq('id', roast.userId)
        .maybeSingle();
      if (data) {
        setProfileUser(data);
      } else {
        setProfileUser({
          id: roast.userId,
          name: roast.userName,
          avatar: roast.userAvatar
        });
      }
    } else {
      setProfileUser({
        id: roast.userId,
        name: roast.userName,
        avatar: roast.userAvatar
      });
    }
    setProfileLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Profile */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={target.avatarUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-md border border-slate-200"
        >
          <span className="text-xl">←</span>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            {target.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold shadow-lg">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-4xl font-headline text-slate-900 mb-2">{target.name}</h2>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3 bg-white/80 p-2 rounded-lg backdrop-blur-sm border border-slate-200">
            {target.description}
          </p>
          <div className="flex gap-4 text-xs font-bold text-orange-600">
            <span>{t('details_roasts', { count: targetStats.roastCount })}</span>
            <span>{t('details_total_likes', { count: targetStats.totalLikes })}</span>
          </div>
        </div>
      </div>

      {/* Roasts Feed */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{t('details_comments_title', { count: roasts.length })}</h3>
          <div className="flex bg-slate-100 rounded-full p-1">
            <button 
              onClick={() => setSort('hot')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'hot' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
            >
              {t('details_sort_hot')}
            </button>
            <button 
              onClick={() => setSort('new')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'new' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
            >
              {t('details_sort_new')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {!isAuthenticated && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
              {t('details_login_required_comment')}
              <button
                onClick={() => onRequireLogin?.()}
                className="ml-2 text-orange-600 font-bold"
              >
                {t('details_login_cta')}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="text-sm text-slate-400">{t('app_loading')}</div>
          )}
          {mainComments.map(roast => {
            const replies = replyMap[roast.id] || [];
            const isExpanded = expandedReplyIds.has(roast.id);
            const visibleReplies = isExpanded ? replies : replies.slice(0, 1);
            return (
              <div key={roast.id} className="animate-in slide-in-from-bottom-4 fade-in">
                <div className="flex gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => handleOpenProfile(roast)}
                    className="relative"
                  >
                    <img src={roast.userAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    {roast.isChampion && (
                      <span className="absolute -top-1 -right-1 text-sm">👑</span>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(roast)}
                        className="text-sm font-bold text-orange-600"
                      >
                        {roast.userName}
                      </button>
                      <span className="text-[10px] text-slate-400">{roast.timestamp}</span>
                    </div>
                    {roast.replyToUserName && (
                      <div className="text-xs text-slate-500 mb-1">
                        {t('details_reply')} <span className="text-orange-600 font-bold">@{roast.replyToUserName}</span>
                      </div>
                    )}
                    <p className="text-slate-700 text-sm leading-relaxed mb-3">
                      {roast.content}
                    </p>
                    
                    {roast.type === 'image' && roast.mediaUrl && (
                      <img src={roast.mediaUrl} className="w-48 rounded-xl mb-3 border border-slate-200" />
                    )}
                    {roast.type === 'audio' && roast.mediaUrl && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={roast.mediaUrl} />
                        </audio>
                        <button
                          onClick={() => toggleTranscript(roast.id)}
                          className="mt-2 text-xs text-orange-600 font-bold"
                        >
                          {t('details_audio_transcript')}
                        </button>
                        {showTranscriptIds.has(roast.id) && (
                          <div className="text-xs text-slate-500 mt-1">
                            {roast.transcript ? roast.transcript : t('details_audio_transcript_empty')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleLike(roast.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-500 transition-colors"
                      >
                        <span className="text-base">👍</span>
                        {roast.likes}
                      </button>
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            onRequireLogin?.();
                            return;
                          }
                          setReplyingTo(roast);
                        }}
                        className="text-xs text-slate-500"
                      >
                        {t('details_reply')}
                      </button>
                    </div>

                    {replies.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {visibleReplies.map((reply) => (
                          <div key={reply.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                            <div className="text-[11px] text-slate-500 mb-1">
                              <span className="text-orange-600 font-bold">{reply.userName}</span>
                              {reply.replyToUserName && (
                                <>
                                  {' '}{t('details_reply')}{' '}
                                  <span className="text-orange-600 font-bold">@{reply.replyToUserName}</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-slate-600">{reply.content}</div>
                          </div>
                        ))}
                        {replies.length > 1 && (
                          <button
                            onClick={() => toggleReplies(roast.id)}
                            className="text-[11px] text-orange-600 font-bold"
                          >
                            {isExpanded
                              ? t('details_reply_hide')
                              : t('details_reply_more_count', { count: replies.length - 1 })}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 flex items-center gap-3">
        {replyingTo && (
          <div className="absolute -top-10 left-4 right-4 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 flex items-center justify-between">
            <span>{t('details_reply_prefix', { name: replyingTo.userName })}</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400"
            >
              {t('details_reply_cancel')}
            </button>
          </div>
        )}
        <button
          onClick={handleVoiceToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            isRecording ? 'bg-orange-500 text-white' : 'bg-slate-100'
          }`}
        >
          🎤
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isAuthenticated
                ? (replyingTo
                  ? t('details_reply_prefix', { name: replyingTo.userName })
                  : t('details_comment_placeholder_strong'))
                : t('details_send_login_only')
            }
            className="w-full bg-white border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
            disabled={!isAuthenticated}
          />
        </div>
        <button 
          onClick={() => {
            if (!isAuthenticated) {
              onRequireLogin?.();
              return;
            }
            if (audioBlob) {
              handleSendAudio();
            } else {
              handleSend();
            }
          }}
          className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          {t('details_send')}
        </button>
      </div>
      {textError && (
        <div className="fixed bottom-20 left-4 right-4 bg-white border border-slate-200 rounded-full px-3 py-2 text-xs text-red-500">
          {textError}
        </div>
      )}

      {audioPreviewUrl && (
        <div className="fixed bottom-20 left-4 right-4 bg-white border border-slate-200 rounded-2xl p-3 z-40">
          <div className="text-xs text-slate-500 mb-2">{t('details_audio_preview')}</div>
          <audio controls className="w-full">
            <source src={audioPreviewUrl} />
          </audio>
          <input
            placeholder={t('details_audio_transcript_placeholder')}
            className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
            value={audioTranscript}
            onChange={(e) => setAudioTranscript(e.target.value)}
          />
          {isRecognizing && (
            <div className="text-[10px] text-slate-400 mt-2">{t('details_audio_transcribing')}</div>
          )}
          {audioError && (
            <div className="text-[10px] text-red-500 mt-2">{audioError}</div>
          )}
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-3 top-3 text-slate-400 text-xs"
            >
              {t('app_close')}
            </button>
            {profileLoading && (
              <div className="text-sm text-slate-400">{t('app_loading')}</div>
            )}
            {!profileLoading && profileUser && (
              <div className="flex flex-col items-center text-center gap-3">
                <img
                  src={profileUser.avatar}
                  className="w-16 h-16 rounded-full border border-slate-200"
                />
                <div className="text-base font-bold text-slate-900">{profileUser.name}</div>
                {profileUser.level !== undefined && (
                  <div className="text-xs text-slate-500">LV.{profileUser.level}</div>
                )}
                {profileUser.quote && (
                  <p className="text-xs text-slate-600">{profileUser.quote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Details;
