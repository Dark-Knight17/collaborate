import React, { useState, useMemo } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Users, Mail, BookOpen, Search, Filter, ArrowUpDown, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentRowProps {
  student: { id: string; name: string; email: string };
  courses: { id: string; title: string; courseCode: string }[];
  onAction: (id: string) => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ student, courses, onAction }) => {
  return (
    <tr className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
      <td style={{ padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--theme-color), var(--accent))',
            color: '#fff', fontSize: '0.9rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-color) 20%, transparent)'
          }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{student.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={12} /> {student.email}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {courses.map(course => (
            <span 
              key={course.id}
              style={{ 
                padding: '0.25rem 0.6rem', borderRadius: '100px', 
                background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--theme-color) 15%, transparent)',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--theme-color)',
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              <BookOpen size={10} /> {course.courseCode}
            </span>
          ))}
        </div>
      </td>
      <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
        <button 
          className="btn-icon" 
          style={{ color: 'var(--theme-color)', background: 'color-mix(in srgb, var(--theme-color) 10%, transparent)', borderRadius: '10px' }}
          onClick={() => onAction(student.id)}
          title="Send Message"
        >
          <MessageSquare size={16} />
        </button>
      </td>
    </tr>
  );
};

export const LecturerStudents: React.FC = () => {
  const { courses } = useMockData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  const handleMessageStudent = (studentId: string) => {
    navigate('/lecturer/messages', { state: { studentId } });
  };

  // Aggregate all unique students across all courses
  const studentsMap = useMemo(() => {
    const map = new Map<string, { student: { id: string; name: string; email: string }; courses: { id: string; title: string; courseCode: string }[] }>();
    
    courses.forEach(course => {
      course.students.forEach(student => {
        if (!map.has(student.id)) {
          map.set(student.id, { 
            student, 
            courses: [{ id: course.id, title: course.title, courseCode: course.courseCode }] 
          });
        } else {
          map.get(student.id)!.courses.push({ id: course.id, title: course.title, courseCode: course.courseCode });
        }
      });
    });
    
    return map;
  }, [courses]);

  const allStudents = useMemo(() => Array.from(studentsMap.values()), [studentsMap]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(item => {
      const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = selectedCourseId === 'all' || item.courses.some(c => c.id === selectedCourseId);
      return matchesSearch && matchesCourse;
    }).sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [allStudents, searchTerm, selectedCourseId]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.75px', marginBottom: '0.5rem' }}>Students</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            A comprehensive list of students enrolled across all your active courses.
          </p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem', 
          padding: '0.75rem 1.25rem', borderRadius: '16px', 
          background: 'color-mix(in srgb, var(--theme-color) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--theme-color) 15%, transparent)'
        }}>
          <Users size={20} color="var(--theme-color)" />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--theme-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{allStudents.length}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="input-field" 
            style={{ paddingLeft: '2.75rem', height: '44px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px' }}>
          <Filter size={18} color="var(--text-secondary)" />
          <select 
            className="input-field" 
            style={{ height: '44px', cursor: 'pointer' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Student Name <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Enrolled Courses
              </th>
              <th style={{ padding: '1rem', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>No students found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try adjusting your search or filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredStudents.map(item => (
                <StudentRow 
                  key={item.student.id} 
                  student={item.student} 
                  courses={item.courses} 
                  onAction={handleMessageStudent}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Stats */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
        Showing {filteredStudents.length} of {allStudents.length} total unique students
      </div>
    </div>
  );
};
