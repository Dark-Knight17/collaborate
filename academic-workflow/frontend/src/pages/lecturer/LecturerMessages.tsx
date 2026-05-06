import React, { useState, useEffect, useRef } from 'react';
import { useMockData } from '../../context/MockDataContext';
import type { Message } from '../../context/MockDataContext';
import { Send, MessageSquare, Pin, Reply, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const AvatarBubble: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 36, color = 'var(--theme-color)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '10px',
    background: color,
    color: 'var(--bg-app)', fontSize: size * 0.37, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
  }}>
    {name.charAt(0).toUpperCase()}
  </div>
);

export const LecturerMessages: React.FC = () => {
  const { courses, messages, addMessage, editMessage, pinMessage, user } = useMockData();
  const location = useLocation();
  
  // Aggregate all unique students from the lecturer's courses
  const allStudents = courses.flatMap(c => c.students || []);
  const students = Array.from(new Map(allStudents.map(s => [s.id, s])).values());
  
  const [selectedId, setSelectedId] = useState(location.state?.studentId || students[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewChat, setViewChat] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update selected student if navigation state changes
  useEffect(() => {
    if (location.state?.studentId) {
      setSelectedId(location.state.studentId);
    }
  }, [location.state?.studentId]);

  const dmChatId = user ? [user.id, selectedId].sort().join('_') : '';
  const roomMessages = messages.filter(m => m.dmChatId === dmChatId);
  const pinned = roomMessages.filter(m => m.isPinned);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [roomMessages.length]);

  if (!user) return null;

  const send = () => {
    if (!inputText.trim() || !selectedId) return;
    addMessage(undefined, inputText, undefined, replyingTo?.id, dmChatId);
    setInputText('');
    setReplyingTo(null);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) editMessage(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      height: '100%', 
      gap: isMobile ? '0' : '1.5rem',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Sidebar - Hidden on mobile if viewing chat */}
      {(!isMobile || !viewChat) && (
        <div className="card" style={{ 
          width: isMobile ? '100%' : '260px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1.25rem 0', 
          flexShrink: 0,
          height: isMobile ? '100%' : 'auto'
        }}>
          <h3 style={{ padding: '0 1.25rem 0.875rem', borderBottom: '1px solid var(--border-color)', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
            Direct Messages
          </h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {students.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelectedId(s.id); if (isMobile) setViewChat(true); }}
                style={{
                  padding: '0.875rem 1.25rem', cursor: 'pointer',
                  background: selectedId === s.id ? 'var(--bg-app)' : 'transparent',
                  borderLeft: selectedId === s.id ? '3px solid var(--theme-color)' : '3px solid transparent',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <AvatarBubble name={s.name} size={30} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Student</div>
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No students assigned yet</div>
            )}
          </div>
        </div>
      )}

      {/* Chat area - Hidden on mobile if not viewing chat */}
      {(!isMobile || viewChat) && (
        <div className="card" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0, 
          overflow: 'hidden',
          height: isMobile ? '100%' : 'auto'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {isMobile && (
                <button 
                  className="btn-icon" 
                  onClick={() => setViewChat(false)}
                  style={{ marginRight: '0.5rem', padding: '0.4rem' }}
                >
                  <Pin size={16} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              )}
              {selectedId && <AvatarBubble name={students.find(s => s.id === selectedId)?.name || '?'} size={38} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{students.find(s => s.id === selectedId)?.name || 'Select a student'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{students.find(s => s.id === selectedId)?.email || ''}</div>
              </div>
            </div>
            {pinned.length > 0 && !isMobile && (
              <button onClick={() => setShowPinned((v: boolean) => !v)} className="btn btn-secondary" style={{ gap: '0.4rem', fontSize: '0.78rem', padding: '0.35rem 0.8rem', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
                <Pin size={12} /> {pinned.length} Pinned {showPinned ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {/* Pinned panel */}
          {showPinned && pinned.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Pin size={10} /> Pinned</div>
              {pinned.map(pm => (
                <div key={pm.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                  <AvatarBubble name={pm.senderName} size={26} color="#f59e0b" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{pm.senderName}</div>
                    <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pm.text}</div>
                  </div>
                  <button onClick={() => pinMessage(pm.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 0 }}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {roomMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, gap: '0.5rem', paddingTop: '3rem' }}>
                <MessageSquare size={36} />
                <div style={{ fontSize: '0.875rem' }}>No messages yet. Start the conversation!</div>
              </div>
            )}
            {roomMessages.map(m => {
              const isMine = m.senderId === user.id;
              const isEditing = editingId === m.id;
              return (
                <div key={m.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isMine ? 'flex-end' : 'flex-start', 
                  gap: '0.2rem', 
                  maxWidth: isMobile ? '90%' : '78%', 
                  alignSelf: isMine ? 'flex-end' : 'flex-start' 
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem', paddingLeft: isMine ? 0 : '0.2rem' }}>
                    {!isMine && <><span style={{ fontWeight: 600 }}>{m.senderName}</span><span>·</span></>}
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {m.isPinned && <span style={{ color: '#f59e0b' }}>📌</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                    {!isMine && <AvatarBubble name={m.senderName} size={32} />}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--theme-color)', borderRadius: '14px', padding: '0.5rem 0.75rem' }}>
                        <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', minWidth: '180px' }} />
                        <button onClick={saveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-color)', display: 'flex' }}><Check size={15} /></button>
                        <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', display: 'flex' }}><X size={15} /></button>
                      </div>
                    ) : (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: isMine ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: isMine ? 'var(--theme-color)' : 'var(--bg-app)', color: isMine ? 'var(--bg-app)' : 'var(--text-primary)', fontSize: '0.9rem', border: isMine ? 'none' : '1px solid var(--border-color)', wordBreak: 'break-word' }}>
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
            {replyingTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'color-mix(in srgb, var(--theme-color) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 15%, transparent)', borderRadius: '8px', padding: '0.4rem 0.75rem', marginBottom: '0.6rem' }}>
                <Reply size={12} color="var(--theme-color)" />
                <div style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Replying to {replyingTo.senderName}: {replyingTo.text}</div>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><X size={13} /></button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                ref={inputRef}
                className="input-field"
                placeholder={selectedId ? `Message ${students.find(s => s.id === selectedId)?.name.split(' ')[0]}...` : 'Select a student to message...'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={!selectedId}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={{ flex: 1, height: '46px' }}
              />
              <button className="btn btn-primary" onClick={send} style={{ height: '46px', width: '46px', padding: 0, flexShrink: 0, background: 'var(--theme-color)', color: 'var(--bg-app)' }}>
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
