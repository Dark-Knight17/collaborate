import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, Users, Sparkles, ChevronDown, ArrowRight, BookOpen, Shield, Zap } from 'lucide-react';

type Role = 'student' | 'lecturer';

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#fcfcfd', color: '#0f172a', minHeight: '100vh', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      {/* Background Grain/Texture Overlay */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.02, pointerEvents: 'none', backgroundImage: 'var(--bg-grain)', zIndex: 0 }}></div>

      {/* Modern Glass Navbar */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
        padding: isScrolled ? '0.75rem 0' : '1.5rem 0',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <nav style={{ 
          margin: '0 auto', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '0.6rem 1rem 0.6rem 2rem', 
          background: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)', 
          backdropFilter: 'blur(20px)', borderRadius: '100px', 
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: isScrolled ? '0 10px 40px rgba(0, 0, 0, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <div 
            style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.75px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--accent-purple), color-mix(in srgb, var(--accent-purple) 80%, black))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-purple) 20%, transparent)',
              padding: '3px'
            }}>
              <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }} alt="Logo" />
            </div>
            <span>Collaborate</span>
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }} className="hide-mobile">
            <a href="#features" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-text-dark">Features</a>
            <a href="#about" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-text-dark">About</a>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ border: 'none', fontWeight: 700, padding: '0.6rem 1.25rem' }}
              onClick={() => navigate('/login?mode=login')}
            >
              Login
            </button>
            <button 
              className="btn" 
              style={{ 
                background: '#0f172a', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '100px', 
                fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' 
              }} 
              onClick={() => navigate('/login?mode=register')}
            >
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section - Redesigned for Premium Impact */}
      <section style={{ 
        padding: '12rem 2rem 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', 
        position: 'relative', zIndex: 1, minHeight: '90vh', justifyContent: 'center'
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)', zIndex: -1 }}></div>

        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '400px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)', marginBottom: '2rem' }}>
              <Zap size={14} fill="currentColor" /> NEW: AI Task Blueprints 2.0
            </div>
            
            <h1 style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', color: '#0f172a', marginBottom: '2rem' }}>
              Academic work,<br />
              <span style={{ 
                background: 'linear-gradient(to right, var(--accent-purple), #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>fully optimized.</span>
            </h1>

            <p style={{ fontSize: '1.4rem', color: '#475569', maxWidth: '580px', marginBottom: '3.5rem', lineHeight: 1.5, fontWeight: 500 }}>
              The unified workspace for students and lecturers. Build project milestones, sync deadlines, and collaborate with breakthrough speed.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ 
                  background: '#0f172a', color: '#fff', padding: '1.25rem 2.5rem', fontSize: '1.1rem', borderRadius: '100px', 
                  fontWeight: 700, transition: 'all 0.3s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
                }} 
                onClick={() => navigate('/login?role=student&mode=login')}
              >
                Sign in as Student
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  background: 'transparent', border: '2px solid #e2e8f0', color: '#0f172a', padding: '1.25rem 2rem', fontSize: '1.1rem', 
                  borderRadius: '100px', fontWeight: 700 
                }} 
                onClick={() => navigate('/login?role=lecturer&mode=login')}
              >
                Sign in as Lecturer
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)', 
              filter: 'blur(60px)', zIndex: -1 
            }}></div>
            <img 
              src="/academic_hero.png" 
              alt="Collaborate AI Illustration" 
              style={{ width: '100%', maxWidth: '650px', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.05))', transform: 'rotate(-2deg)', mixBlendMode: 'multiply' }} 
              className="float-animation"
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section - Refined Contrast and Spacing */}
      <section id="features" style={{ padding: '12rem 2.5rem', background: '#0a0b0e', color: '#f8fafc', position: 'relative', overflow: 'hidden', borderRadius: '60px 60px 0 0' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
            <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-purple)', letterSpacing: '3px', marginBottom: '1.5rem' }}>Core Capabilities</div>
            <h2 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '2rem', color: '#ffffff', lineHeight: 1 }}>Engineered for excellence.</h2>
            <p style={{ fontSize: '1.4rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto', fontWeight: 400 }}>Everything you need to move from a brainstorm to a submission-ready project.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }} className="features-grid">
            {[
              { 
                title: 'AI Task Generation', 
                icon: <Zap size={28} />, 
                color: 'var(--accent-purple)', 
                desc: 'Watch our AI break down your topic into professional, manageable milestones.' 
              },
              { 
                title: 'Deadline Intelligence', 
                icon: <Clock size={28} />, 
                color: 'var(--accent-yellow)', 
                desc: 'Collaborate tracks submissions and alerts the whole group to approaching deadlines.' 
              },
              { 
                title: 'Integrated Chat', 
                icon: <Users size={28} />, 
                color: 'var(--accent-red)', 
                desc: 'Group chats with @mention support and #tags for specific tasks. Unified context.' 
              },
              { 
                title: 'Smart Resource Hub', 
                icon: <BookOpen size={28} />, 
                color: 'var(--accent-blue)', 
                desc: 'A centralized repository for research papers, drafts, and shared project assets.' 
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="card"
                style={{ 
                  background: '#15171c', padding: '3rem 2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.3s ease', cursor: 'default', display: 'flex', flexDirection: 'column', gap: '1.25rem'
                }}
              >
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '18px', background: feature.color, color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px ${feature.color}22`
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{feature.title}</h3>
                <p style={{ color: '#ffffff', lineHeight: 1.5, fontSize: '0.95rem', opacity: 0.85 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Premium Visual Layout */}
      <section id="about" style={{ padding: '12rem 2rem', background: '#ffffff', color: '#0f172a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '400px', position: 'relative' }}>
             <img 
              src="/academic_mission.png" 
              alt="Our Mission" 
              style={{ width: '100%', borderRadius: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.05)', mixBlendMode: 'multiply' }} 
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '400px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-purple)', letterSpacing: '3px', marginBottom: '2rem' }}>Our Mission</div>
            <h2 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginBottom: '2.5rem' }}>Bridging the gap between <span style={{ color: '#94a3b8' }}>instruction</span> and <span style={{ color: 'var(--accent-purple)' }}>execution.</span></h2>
            <p style={{ fontSize: '1.5rem', color: '#475569', lineHeight: 1.6, fontWeight: 500, marginBottom: '3rem' }}>
              Collaborate was built with a simple goal: to make academic group projects less stressful and more productive. 
              By leveraging advanced AI and intuitive design, we provide students and lecturers with a unified workspace that fosters clarity, accountability, and breakthrough results.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              <div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>10x</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Faster Setup</div>
              </div>
              <div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>100%</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Transparency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{ padding: '10rem 2rem', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '3rem', letterSpacing: '-2px', lineHeight: 1 }}>Ready to elevate your group work?</h2>
          <button 
            className="btn" 
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-purple), #6366f1)', color: '#fff', 
              padding: '1.5rem 4rem', fontSize: '1.4rem', borderRadius: '100px', fontWeight: 800,
              boxShadow: '0 20px 50px rgba(139, 92, 246, 0.3)', transition: 'all 0.3s ease'
            }} 
            onClick={() => navigate('/login')}
          >
            Get Started for Free <ArrowRight size={24} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer style={{ padding: '6rem 4rem', borderTop: '1px solid #f1f5f9', background: '#fff', color: '#64748b', fontSize: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontWeight: 800, color: '#0f172a', fontSize: '1.25rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, var(--accent-purple), color-mix(in srgb, var(--accent-purple) 80%, black))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2px'
            }}>
               <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }} alt="Logo" />
            </div>
            Collaborate
          </div>
          
          <div style={{ display: 'flex', gap: '3rem', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer' }} className="hover-text-dark">Privacy</span>
            <span style={{ cursor: 'pointer' }} className="hover-text-dark">Terms</span>
            <span style={{ cursor: 'pointer' }} className="hover-text-dark">Contact</span>
          </div>
          
          <div style={{ fontWeight: 500 }}>
            © 2026 Collaborate AI. Architecting Academic Success.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
