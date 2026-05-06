import React, { useState, useEffect, useRef } from 'react';
import { useMockData } from '../context/MockDataContext';
import { Send, Hash, Pin, Reply, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message } from '../context/MockDataContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const AvatarBubble: React.FC<{ name: string; size?: number }> = ({ name, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--theme-color), var(--accent))',
    color: '#fff', fontSize: size * 0.37, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-color) 20%, transparent)'
  }}>
    {name.charAt(0).toUpperCase()}
  </div>
);

// ── Message Row ───────────────────────────────────────────────────────────────
interface MessageRowProps {
  message: Message;
  isMine: boolean;
  allMessages: Message[];
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  editingId: string | null;
  editText: string;
  setEditText: (t: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

const MessageRow: React.FC<MessageRowProps> = ({
  message, isMine, allMessages,
  onReply, onEdit, onDelete, onPin,
  editingId, editText, setEditText, onEditSave, onEditCancel
}) => {
  const [hovered, setHovered] = useState(false);
  const isEditing = editingId === message.id;
  const replyTarget = message.replyToId ? allMessages.find(m => m.id === message.replyToId) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        position: 'relative',
        gap: '0.2rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sender label + timestamp */}
      <div style={{
        fontSize: '0.75rem', color: 'var(--text-secondary)',
        display: 'flex', gap: '0.5rem', fontWeight: 600,
        flexDirection: isMine ? 'row-reverse' : 'row', paddingLeft: isMine ? 0 : '0.25rem'
      }}>
        {!isMine && <span>{message.senderName}</span>}
        {!isMine && <span style={{ opacity: 0.5 }}>•</span>}
        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {message.isEdited && <span style={{ opacity: 0.5, fontStyle: 'italic' }}>edited</span>}
        {message.isPinned && (
          <span style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Pin size={10} />pinned
          </span>
        )}
      </div>

      {/* Reply preview */}
      {replyTarget && (
        <div style={{
          borderLeft: '3px solid var(--accent-purple)',
          paddingLeft: '0.625rem',
          marginBottom: '0.15rem',
          marginLeft: isMine ? 0 : '0.25rem',
          maxWidth: '100%',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '1px' }}>
            ↩ {replyTarget.senderName}
          </div>
          <div style={{
            fontSize: '0.78rem', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px'
          }}>
            {replyTarget.text}
          </div>
        </div>
      )}

      {/* Bubble row: avatar + bubble + action bar */}
      <div style={{
        display: 'flex', gap: '0.75rem',
        flexDirection: isMine ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
      }}>
        {!isMine && <AvatarBubble name={message.senderName} />}

        {/* Bubble */}
        {isEditing ? (
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: 'var(--bg-app)', border: '1px solid var(--accent-purple)',
            borderRadius: '16px', padding: '0.5rem 0.75rem',
            boxShadow: '0 0 0 2px color-mix(in srgb, var(--theme-color) 15%, transparent)'
          }}>
            <input
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel(); }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem', minWidth: '200px'
              }}
            />
            <button onClick={onEditSave} title="Save" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}>
              <Check size={16} />
            </button>
            <button onClick={onEditCancel} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{
            padding: '0.875rem 1.125rem',
            borderRadius: isMine ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
            background: isMine ? 'var(--accent-purple)' : 'var(--bg-app)',
            color: isMine ? '#fff' : 'var(--text-primary)',
            fontSize: '0.9375rem', lineHeight: 1.55,
            border: isMine ? 'none' : '1px solid var(--border-color)',
            boxShadow: isMine ? '0 4px 15px color-mix(in srgb, var(--theme-color) 20%, transparent)' : 'none',
            wordBreak: 'break-word',
            transition: 'opacity 0.15s',
            opacity: hovered ? 0.95 : 1,
          }}>
            {message.text}
          </div>
        )}

        {/* Action bar (shown on hover) */}
        {!isEditing && hovered && (
          <div style={{
            display: 'flex', gap: '2px', alignItems: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '20px', padding: '3px 6px',
            boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.1s ease',
            flexDirection: isMine ? 'row-reverse' : 'row',
          }}>
            <ActionBtn icon={<Reply size={13} />} label="Reply" onClick={() => onReply(message)} />
            <ActionBtn
              icon={<Pin size={13} />}
              label={message.isPinned ? 'Unpin' : 'Pin'}
              onClick={() => onPin(message.id)}
              active={message.isPinned}
            />
            {isMine && (
              <>
                <ActionBtn icon={<Pencil size={13} />} label="Edit" onClick={() => onEdit(message)} />
                <ActionBtn icon={<Trash2 size={13} />} label="Delete" onClick={() => onDelete(message.id)} danger />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; active?: boolean }> = ({ icon, label, onClick, danger, active }) => (
  <button
    title={label}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '26px', height: '26px', borderRadius: '50%',
      border: 'none', background: 'transparent', cursor: 'pointer',
      color: danger ? 'var(--accent-red)' : active ? 'var(--accent-yellow)' : 'var(--text-secondary)',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.background = danger
        ? 'rgba(239,68,68,0.1)' : active ? 'rgba(234,179,8,0.1)' : 'var(--bg-card-hover)';
      (e.currentTarget as HTMLButtonElement).style.color = danger
        ? 'var(--accent-red)' : active ? 'var(--accent-yellow)' : 'var(--text-primary)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      (e.currentTarget as HTMLButtonElement).style.color = danger ? 'var(--accent-red)' : active ? 'var(--accent-yellow)' : 'var(--text-secondary)';
    }}
  >
    {icon}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const MessagesTab: React.FC = () => {
  const { projects, messages, addMessage, editMessage, deleteMessage, pinMessage, tasks, user, courses } = useMockData();
  
  const lecturers = Array.from(new Map(courses.map((c: any) => [c.lecturerId, { id: c.lecturerId, name: c.lecturerName }])).values());
  
  const [selectedMode, setSelectedMode] = useState<'project' | 'dm'>(projects.length > 0 ? 'project' : 'dm');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [selectedLecturerId, setSelectedLecturerId] = useState(lecturers[0]?.id || '');
  
  const [inputText, setInputText] = useState('');
  const [showMentions, setShowMentions] = useState<'user' | 'task' | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const dmChatId = selectedLecturerId ? [user.id, selectedLecturerId].sort().join('_') : '';
  const currentMessages = selectedMode === 'project' 
    ? messages.filter((m: any) => m.projectId === selectedProjectId)
    : messages.filter((m: any) => m.dmChatId === dmChatId);
    
  const pinnedMessages = currentMessages.filter((m: any) => m.isPinned);
  const projectTasks = selectedMode === 'project' ? tasks.filter((t: any) => t.projectId === selectedProjectId) : [];
  const projectMembers = selectedMode === 'project' ? projects.find((p: any) => p.id === selectedProjectId)?.members || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart || 0;
    setInputText(value);
    setCursorPos(pos);
    const lastChar = value.slice(0, pos).split('').reverse().join('').match(/^(\w*?)([@#])/);
    if (lastChar) {
      setShowMentions(lastChar[2] === '@' ? 'user' : 'task');
    } else {
      setShowMentions(null);
    }
  };

  const insertMention = (type: 'user' | 'task', label: string) => {
    const before = inputText.slice(0, cursorPos).replace(/[@#]\w*$/, '');
    const after = inputText.slice(cursorPos);
    setInputText(`${before}${type === 'user' ? '@' : '#'}${label} ${after}`);
    setShowMentions(null);
    inputRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (selectedMode === 'project') {
      addMessage(selectedProjectId, inputText, undefined, replyingTo?.id);
    } else {
      addMessage(undefined, inputText, undefined, replyingTo?.id, dmChatId);
    }
    setInputText('');
    setReplyingTo(null);
  };

  const handleEditSave = () => {
    if (editingId && editText.trim()) {
      editMessage(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this message?')) deleteMessage(id);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: '100%', gap: '2rem' }}>
      {/* ── Sidebar ── */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0 }}>
        <h3 style={{ padding: '0 1.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border-color)', margin: 0, fontSize: '1rem' }}>
          Project Chats
        </h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projects.map((p: any) => {
            const unread = messages.filter((m: any) => m.projectId === p.id).length;
            const isSelected = selectedMode === 'project' && selectedProjectId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => { setSelectedProjectId(p.id); setSelectedMode('project'); }}
                style={{
                  padding: '0.875rem 1.5rem', cursor: 'pointer',
                  background: isSelected ? 'var(--bg-app)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{p.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Group Chat</div>
                </div>
                {unread > 0 && (
                  <div style={{
                    minWidth: '20px', height: '20px', borderRadius: '10px',
                    background: 'var(--accent-purple)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px'
                  }}>
                    {unread}
                  </div>
                )}
              </div>
            );
          })}
          
          {lecturers.length > 0 && (
            <>
              <h3 style={{ padding: '1.25rem 1.5rem 0.75rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                Direct Messages
              </h3>
              {lecturers.map((l: any) => {
                const dmId = [user.id, l.id].sort().join('_');
                const unread = messages.filter((m: any) => m.dmChatId === dmId).length;
                const isSelected = selectedMode === 'dm' && selectedLecturerId === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => { setSelectedLecturerId(l.id); setSelectedMode('dm'); }}
                    style={{
                      padding: '0.875rem 1.5rem', cursor: 'pointer',
                      background: isSelected ? 'var(--bg-app)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent-purple)' : '3px solid transparent',
                      transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AvatarBubble name={l.name} size={28} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{l.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Lecturer</div>
                      </div>
                    </div>
                    {unread > 0 && (
                      <div style={{
                        minWidth: '20px', height: '20px', borderRadius: '10px',
                        background: 'var(--accent-purple)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px'
                      }}>
                        {unread}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.125rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedMode === 'dm' && <AvatarBubble name={lecturers.find((l: any) => l.id === selectedLecturerId)?.name || '?'} size={24} />}
              {selectedMode === 'project' 
                ? projects.find((p: any) => p.id === selectedProjectId)?.title
                : lecturers.find((l: any) => l.id === selectedLecturerId)?.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {selectedMode === 'project' ? `${projectMembers.length} Members Active` : 'Online'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
            {/* Pinned toggle */}
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinnedPanel(v => !v)}
                className="btn btn-secondary"
                style={{
                  gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.875rem',
                  color: 'var(--accent-yellow)', borderColor: 'rgba(234,179,8,0.25)',
                  background: 'rgba(234,179,8,0.06)'
                }}
              >
                <Pin size={13} />
                {pinnedMessages.length} Pinned
                {showPinnedPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}

          </div>
        </div>

        {/* Pinned messages panel */}
        {showPinnedPanel && pinnedMessages.length > 0 && (
          <div style={{
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(234,179,8,0.04)',
            padding: '0.75rem 1.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-yellow)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Pin size={11} /> Pinned Messages
            </div>
            {pinnedMessages.map((pm: any) => (
              <div key={pm.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                background: 'var(--bg-card)', border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: '10px', padding: '0.625rem 0.875rem',
              }}>
                <AvatarBubble name={pm.senderName} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1px' }}>{pm.senderName}</div>
                  <div style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pm.text}</div>
                </div>
                <button
                  onClick={() => pinMessage(pm.id)}
                  title="Unpin"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '2px', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentMessages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: 0.5, paddingTop: '3rem' }}>
              <div style={{ fontSize: '2rem' }}>💬</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No messages yet. Start the conversation!</div>
            </div>
          )}
          {currentMessages.map((m: any) => (
            <MessageRow
              key={m.id}
              message={m}
              isMine={m.senderId === user.id}
              allMessages={currentMessages}
              onReply={setReplyingTo}
              onEdit={startEdit}
              onDelete={handleDelete}
              onPin={pinMessage}
              editingId={editingId}
              editText={editText}
              setEditText={setEditText}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-color)', position: 'relative', background: 'var(--bg-app)' }}>
          {/* Reply indicator */}
          {replyingTo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'color-mix(in srgb, var(--theme-color) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 15%, transparent)',
              borderRadius: '10px', padding: '0.5rem 0.875rem', marginBottom: '0.75rem'
            }}>
              <Reply size={13} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '1px' }}>
                  Replying to {replyingTo.senderName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {replyingTo.text}
                </div>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Mentions Popover */}
          {showMentions && (
            <div className="card glass-card shadow-lg animate-scale-in" style={{
              position: 'absolute', bottom: '100%', left: '1.75rem',
              width: '280px', borderRadius: '16px', border: '1px solid var(--border-color)',
              overflow: 'hidden', marginBottom: '0.5rem', zIndex: 10, padding: '0.5rem'
            }}>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-purple)', opacity: 0.8 }}>
                {showMentions === 'user' ? 'Mention Group Member' : 'Reference Task'}
              </div>
              {showMentions === 'user' ? (
                projectMembers.map((m: any) => (
                  <div key={m} onClick={() => insertMention('user', m)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '10px' }} className="sidebar-link">
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-purple)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{m[0]}</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m}</span>
                  </div>
                ))
              ) : (
                projectTasks.map((t: any) => (
                  <div key={t.id} onClick={() => insertMention('task', t.title)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '10px' }} className="sidebar-link">
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hash size={12} color="var(--accent-purple)" />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              ref={inputRef}
              className="input-field"
              placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : selectedMode === 'project' ? 'Type a message… (Use @ for members, # for tasks)' : 'Message your lecturer...'}
              value={inputText}
              onChange={selectedMode === 'project' ? handleInputChange : (e) => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              style={{ flex: 1, height: '48px' }}
            />
            <button className="btn btn-primary" onClick={handleSendMessage} style={{ height: '48px', width: '48px', padding: 0, flexShrink: 0 }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>


    </div>
  );
};
