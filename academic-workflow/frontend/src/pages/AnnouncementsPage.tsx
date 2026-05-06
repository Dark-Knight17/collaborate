import React, { useEffect, useState } from 'react';
import { useMockData } from '../context/MockDataContext';
import type { Announcement, Course } from '../context/MockDataContext';
import { BookOpen, Layers, Clock, RefreshCw, FileText, ExternalLink, ChevronDown } from 'lucide-react';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useNavigate } from 'react-router-dom';

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AnnouncementCard: React.FC<{ ann: Announcement; course: Course }> = ({ ann, course }) => {
  const { user, joinCourseGroup } = useMockData();
  const navigate = useNavigate();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ [ann.id]: true });
  const [createModalGroup, setCreateModalGroup] = useState<number | null>(null);

  const handleJoinGroup = async (courseId: string, groupId: string) => {
    setJoiningGroupId(groupId);
    try {
      await joinCourseGroup(courseId, groupId);
    } catch (e) {
      console.error(e);
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <div
      className="card"
      style={{ padding: '1.375rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      {/* Course badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '100px', background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 18%, transparent)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-purple)', width: 'fit-content' }}>
        <BookOpen size={10} /> {course.courseCode} · {course.title}
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{ann.title}</span>
            {ann.hasGroupAssignment && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.55rem', borderRadius: '100px', background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)', fontSize: '0.7rem', fontWeight: 700, color: '#0ea5e9' }}>
                <Layers size={10} /> Group Assignment
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          <Clock size={12} /> {timeAgo(ann.timestamp)}
        </div>
      </div>

      {/* Body */}
      {ann.body && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {ann.body}
        </p>
      )}

      {/* Groups Section */}
      {ann.hasGroupAssignment && ann.groups && ann.groups.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', cursor: 'pointer' }}
            onClick={() => setExpandedGroups(prev => ({ ...prev, [ann.id]: !prev[ann.id] }))}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Available Groups ({ann.groups.length})
              <ChevronDown size={16} style={{ transform: expandedGroups[ann.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </h4>
          </div>

          {expandedGroups[ann.id] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ann.groups.map((group) => {
                const isJoined = user ? group.memberNames?.includes(user.name) : false;
                const userInOtherGroup = user ? ann.groups?.some(g => g.id !== group.id && g.memberNames.includes(user.name)) : false;
                const hasProject = !!group.projectId;
                
                // Exclude the course lecturer from student-facing counts and avatars
                const studentMembers = group.memberNames?.filter(name => name !== course.lecturerName) || [];
                const memberCount = studentMembers.length;

                return (
                  <div 
                    key={group.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: window.innerWidth <= 1024 ? 'column' : 'row',
                      alignItems: window.innerWidth <= 1024 ? 'flex-start' : 'center', 
                      justifyContent: 'space-between', 
                      padding: '1.25rem', 
                      background: isJoined ? 'color-mix(in srgb, var(--theme-color) 4%, var(--bg-card))' : 'var(--bg-card)', 
                      borderRadius: '16px', 
                      border: isJoined ? '1px solid var(--theme-color)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                      <div style={{ minWidth: '80px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isJoined ? 'var(--theme-color)' : 'var(--text-primary)' }}>
                          Group {group.groupNumber}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex' }}>
                          {studentMembers.slice(0, 3).map((name, idx) => (
                            <div key={idx} title={name} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px solid var(--border-color)', marginLeft: idx === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                              {name.charAt(0)}
                            </div>
                          ))}
                          {memberCount > 3 && (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px solid var(--border-color)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              +{memberCount - 3}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '100px',
                        background: hasProject ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: hasProject ? '#059669' : '#dc2626',
                        border: `1px solid ${hasProject ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {hasProject ? 'Project Created' : 'Project Not Created'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: window.innerWidth <= 1024 ? '100%' : 'auto', justifyContent: window.innerWidth <= 1024 ? 'stretch' : 'flex-end' }}>
                      {!isJoined && !userInOtherGroup && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', flex: window.innerWidth <= 1024 ? 1 : 'none', minWidth: '110px' }}
                          disabled={joiningGroupId === group.id}
                          onClick={() => handleJoinGroup(course.id, group.id)}
                        >
                          {joiningGroupId === group.id ? 'Joining...' : 'Join Group'}
                        </button>
                      )}

                      {isJoined && !hasProject && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', flex: window.innerWidth <= 1024 ? 1 : 'none', minWidth: '110px' }}
                          onClick={() => setCreateModalGroup(group.groupNumber)}
                        >
                          Create Project
                        </button>
                      )}

                      {isJoined && hasProject && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', flex: window.innerWidth <= 1024 ? 1 : 'none', minWidth: '110px', background: 'var(--theme-color)' }}
                          onClick={() => navigate(`/app/project/${group.projectId}`)}
                        >
                          View Project
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {ann.files && ann.files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
          {ann.files.map(f => (
            <div 
              key={f.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '8px', 
                background: 'var(--bg-app)', 
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem'
              }}
            >
              <FileText size={14} color="var(--theme-color)" />
              <span style={{ fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</span>
              <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.4rem' }}>
                <a 
                  href={`http://localhost:8000/uploads/announcements/${f.filename}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-icon"
                  style={{ width: '24px', height: '24px', color: 'var(--theme-color)' }}
                  title="View / Download"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lecturer attribution */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
        Posted by <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.lecturerName}</span>
      </div>

      <CreateProjectModal 
        isOpen={createModalGroup !== null}
        onClose={() => setCreateModalGroup(null)}
        initialCourseId={course.id}
        initialGroupNumber={createModalGroup ? createModalGroup.toString() : ''}
      />
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const { courses, announcements, fetchCourseAnnouncements, refreshCourses } = useMockData();
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      if (courses.length === 0) {
        await refreshCourses();
        return;
      }
      setLoading(true);
      await Promise.all(courses.map(c => fetchCourseAnnouncements(c.id).catch(() => null)));
      setLoading(false);
    };
    loadAll();
  }, [courses.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCourses();
    await Promise.all(courses.map(c => fetchCourseAnnouncements(c.id).catch(() => null)));
    setRefreshing(false);
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedCourseId === 'all') return courses.some(c => c.id === a.courseId);
    return a.courseId === selectedCourseId;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      gap: '1.5rem', 
      height: '100%',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {!isMobile && (
        <div className="card" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '1.25rem 0', flexShrink: 0, alignSelf: 'flex-start' }}>
          <h3 style={{ padding: '0 1.25rem 0.875rem', borderBottom: '1px solid var(--border-color)', margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Filter by Course</h3>
          <div style={{ overflowY: 'auto' }}>
            <div
              onClick={() => setSelectedCourseId('all')}
              style={{
                padding: '0.875rem 1.25rem', cursor: 'pointer',
                background: selectedCourseId === 'all' ? 'var(--bg-app)' : 'transparent',
                borderLeft: selectedCourseId === 'all' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>All Courses</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-app)', padding: '0.1rem 0.45rem', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
                {announcements.filter(a => courses.some(c => c.id === a.courseId)).length}
              </span>
            </div>
            {courses.map(c => {
              const count = announcements.filter(a => a.courseId === c.id).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  style={{
                    padding: '0.875rem 1.25rem', cursor: 'pointer',
                    background: selectedCourseId === c.id ? 'var(--bg-app)' : 'transparent',
                    borderLeft: selectedCourseId === c.id ? '3px solid var(--accent-purple)' : '3px solid transparent',
                    transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{c.courseCode}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{c.title}</div>
                  </div>
                  {count > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 700, background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)', padding: '0.1rem 0.45rem', borderRadius: '100px', border: '1px solid color-mix(in srgb, var(--theme-color) 20%, transparent)', flexShrink: 0 }}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isMobile && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <select 
            className="input-field" 
            style={{ width: '100%', fontSize: '0.875rem' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseCode} - {c.title}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>Announcements</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Updates and group assignments posted by your lecturers.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Loading announcements…
          </div>
        )}

        {!loading && filteredAnnouncements.map(ann => {
          const course = courses.find(c => c.id === ann.courseId);
          if (!course) return null;
          return <AnnouncementCard key={ann.id} ann={ann} course={course} />;
        })}
      </div>
    </div>
  );
};
