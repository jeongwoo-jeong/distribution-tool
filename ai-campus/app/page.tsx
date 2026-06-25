"use client";

import { useState, useEffect } from "react";

type Tab = "홈" | "강의" | "게시판";
type ViewMode = "grid" | "list";

interface Course {
  id: number;
  title: string;
  description: string;
  youtubeId: string;
  likes: number;
  level: string;
}

interface Post {
  id: number;
  text: string;
  createdAt: string;
}

const COURSES: Course[] = [
  { id: 1, title: "AI 입문: 머신러닝이란?",      description: "인공지능과 머신러닝의 기본 개념을 쉽게 배웁니다.",          youtubeId: "ukzFI9rgwfU", likes: 12, level: "입문" },
  { id: 2, title: "파이썬으로 시작하는 AI",       description: "파이썬 기초 문법부터 데이터 분석까지 한 번에.",             youtubeId: "rfscVS0vtbw", likes: 8,  level: "기초" },
  { id: 3, title: "딥러닝 핵심 원리",            description: "신경망의 작동 원리와 딥러닝의 핵심을 다룹니다.",             youtubeId: "aircAruvnKk", likes: 20, level: "기본" },
  { id: 4, title: "ChatGPT 활용법",             description: "업무와 학습에 ChatGPT를 200% 활용하는 방법.",              youtubeId: "JTxsNm9IdYU", likes: 35, level: "기초" },
  { id: 5, title: "데이터 분석 기초",            description: "엑셀·파이썬으로 데이터를 읽고 시각화합니다.",               youtubeId: "r-uOLxNrNk8", likes: 5,  level: "입문" },
  { id: 6, title: "AI 이미지 생성 실습",         description: "Stable Diffusion·Midjourney로 이미지를 만들어봅니다.",     youtubeId: "SVcsDDABEkM", likes: 17, level: "기본" },
];

const STEPS = [
  { n: "01", label: "배우기",   sub: "Learn",  desc: "기초부터 심화까지, 수준별 강의로 나만의 페이스로 학습하세요." },
  { n: "02", label: "만들기",   sub: "Build",  desc: "배운 내용을 직접 구현하며 실제 결과물을 만들어보세요." },
  { n: "03", label: "물어보기", sub: "Ask",    desc: "게시판에서 질문하고 동료와 함께 답을 찾아보세요." },
  { n: "04", label: "자랑하기", sub: "Share",  desc: "완성된 결과물을 공유하고 피드백을 받아보세요." },
];

const LEVEL_BADGES: Record<string, { bg: string; color: string }> = {
  입문: { bg: "#e0f2fe", color: "#0369a1" },
  기초: { bg: "#dcfce7", color: "#15803d" },
  기본: { bg: "#fef9c3", color: "#a16207" },
};

export default function Home() {
  const [tab, setTab]                       = useState<Tab>("홈");
  const [viewMode, setViewMode]             = useState<ViewMode>("grid");
  const [search, setSearch]                 = useState("");
  const [courses, setCourses]               = useState<Course[]>(COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [posts, setPosts]                   = useState<Post[]>([]);
  const [postInput, setPostInput]           = useState("");
  const [activeStep, setActiveStep]         = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("ai-campus-posts");
    if (saved) setPosts(JSON.parse(saved));
  }, []);

  const savePosts = (next: Post[]) => {
    setPosts(next);
    localStorage.setItem("ai-campus-posts", JSON.stringify(next));
  };

  const addPost = () => {
    if (!postInput.trim()) return;
    savePosts([{ id: Date.now(), text: postInput.trim(), createdAt: new Date().toLocaleString("ko-KR") }, ...posts]);
    setPostInput("");
  };

  const toggleLike = (id: number) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)));

  const filtered = courses.filter((c) =>
    c.title.includes(search) || c.description.includes(search)
  );

  const NAV_TABS: Tab[] = ["홈", "강의", "게시판"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ─── 헤더 ─────────────────────────────────── */}
      <header style={{ background: "white", borderBottom: "1px solid #e8eaf0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", height: 60, gap: 32 }}>
          {/* 로고 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: "-0.3px" }}>이랜드리테일 AI 캠퍼스</span>
          </div>

          {/* 탭 내비게이션 */}
          <nav style={{ display: "flex", gap: 4, flex: 1 }}>
            {NAV_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 14px", fontSize: 14, fontWeight: tab === t ? 700 : 500,
                  background: "none", border: "none", cursor: "pointer", borderRadius: 6,
                  color: tab === t ? "#2563eb" : "#64748b",
                  borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </nav>

          {/* 우측 사용자 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700 }}>정</div>
            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>정정우</span>
          </div>
        </div>
      </header>

      {/* ─── 홈 ───────────────────────────────────── */}
      {tab === "홈" && (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 80px" }}>

          {/* 히어로 */}
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 10, letterSpacing: 1 }}>AI CAMPUS</p>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "#0f172a", lineHeight: 1.2, margin: "0 0 14px", letterSpacing: "-1px" }}>
              시간 아깝게 하는 업무?<br />
              <span style={{ color: "#2563eb" }}>이제 AI로 자동화</span> 할 수 있습니다.
            </h1>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
              반복 업무, 보고서, 예약 관리, 데이터 정리까지.<br />
              나만의 업무 자동화 서비스를 직접 만들 수 있도록 도와드립니다.
            </p>

            {/* 스텝 인디케이터 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {["배우기", "만들기", "물어보기", "자랑하기"].map((s, i) => (
                <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, background: "#f1f5f9", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    <span style={{ color: "#2563eb", fontWeight: 800 }}>{i + 1}</span> {s}
                  </span>
                  {i < 3 && <span style={{ color: "#cbd5e1", fontSize: 14 }}>→</span>}
                </span>
              ))}
            </div>
          </section>

          {/* AI 레벨 배너 */}
          <section style={{ background: "linear-gradient(120deg,#1e40af 0%,#2563eb 60%,#3b82f6 100%)", borderRadius: 16, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 56, boxShadow: "0 4px 24px rgba(37,99,235,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📈</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>내 AI 레벨 — Lv 3</span>
                  <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>24점 / 100</span>
                </div>
                <p style={{ color: "#bfdbfe", fontSize: 14, margin: 0 }}>월 1회 재측정으로 성장률을 확인하세요. 지금 다시 측정할 수 있어요.</p>
              </div>
            </div>
            <button
              onClick={() => setTab("강의")}
              style={{ background: "white", color: "#1d4ed8", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              다시 측정 →
            </button>
          </section>

          {/* 4단계 섹션 */}
          {STEPS.map((step, idx) => (
            <section key={step.n} style={{ marginBottom: 56 }}>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
                {/* 왼쪽 레이블 */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 2, background: "#2563eb" }} />
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>{step.n} / 04</span>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>{step.label}</h2>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 8px" }}>{step.sub} the fundamentals</p>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>

                {/* 오른쪽 카드들 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {idx === 0 && (
                    <>
                      <FeatureCard icon="🎓" title="AI 학습 시작하기" desc="따라하기만 하면 기초부터 심화까지 직접 구현할 수 있습니다." accent onClick={() => setTab("강의")} />
                      <FeatureCard icon="📚" title="자료실" desc="AI 학습에 필요한 자료를 한 곳에. 구글 드라이브·Notion 링크를 모아 제공합니다." />
                      <FeatureCard icon="📊" title="수준 진단" desc="나의 현재 AI 수준을 측정하고 맞춤 강의를 추천받아보세요." />
                    </>
                  )}
                  {idx === 1 && (
                    <>
                      <FeatureCard icon="🖥️" title="Claude Code 다운로드" desc="터미널에서 AI가 같이 코딩. 여러 파일을 한 번에 수정." />
                      <FeatureCard icon="🤖" title="ChatGPT 활용" desc="OpenAI의 코딩 전용 AI. ChatGPT 가입자는 바로 사용." />
                      <FeatureCard icon="📋" title="연계 서비스" desc="핵심 서비스·도구를 한 페이지에 정리했습니다." />
                    </>
                  )}
                  {idx === 2 && (
                    <>
                      <FeatureCard icon="💬" title="게시판 질문" desc="모르는 것을 자유롭게 올리고 동료와 함께 해결해보세요." onClick={() => setTab("게시판")} />
                      <FeatureCard icon="🔍" title="강의 검색" desc="원하는 강의를 빠르게 찾아 바로 학습을 시작하세요." onClick={() => setTab("강의")} />
                      <FeatureCard icon="📣" title="AI 뉴스" desc="최신 AI 트렌드와 도구 업데이트를 빠르게 확인하세요." />
                    </>
                  )}
                  {idx === 3 && (
                    <>
                      <FeatureCard icon="🏆" title="결과물 공유" desc="만든 서비스·프롬프트를 게시판에 올리고 피드백을 받으세요." onClick={() => setTab("게시판")} />
                      <FeatureCard icon="❤️" title="좋아요 랭킹" desc={`현재까지 가장 많은 좋아요: ${Math.max(...courses.map(c => c.likes))}개`} />
                      <FeatureCard icon="🎯" title="미션 완료" desc="각 강의를 완주하고 레벨업을 향해 도전하세요." onClick={() => setTab("강의")} />
                    </>
                  )}
                </div>
              </div>
            </section>
          ))}
        </main>
      )}

      {/* ─── 강의 탭 ──────────────────────────────── */}
      {tab === "강의" && (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>강의 목록</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>총 {courses.length}개의 강의가 준비돼 있어요. 지금 바로 시작하세요.</p>
          </div>

          {/* 검색 + 보기 전환 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder="강의 제목으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px 11px 38px", fontSize: 14, outline: "none", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
              {(["grid", "list"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setViewMode(v)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: viewMode === v ? "white" : "transparent", color: viewMode === v ? "#1d4ed8" : "#64748b", boxShadow: viewMode === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                  {v === "grid" ? "⊞ 그리드" : "☰ 리스트"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "80px 0", fontSize: 15 }}>검색 결과가 없습니다.</div>
          )}

          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 }}>
              {filtered.map((c) => <CourseCard key={c.id} course={c} onPlay={() => setSelectedCourse(c)} onLike={() => toggleLike(c.id)} />)}
            </div>
          )}
          {viewMode === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((c) => <CourseListItem key={c.id} course={c} onPlay={() => setSelectedCourse(c)} onLike={() => toggleLike(c.id)} />)}
            </div>
          )}
        </main>
      )}

      {/* ─── 게시판 탭 ────────────────────────────── */}
      {tab === "게시판" && (
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 28px 80px" }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>자유 게시판</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>질문, 완성 결과물, 아이디어 뭐든지 올려보세요.</p>
          </div>

          {/* 글쓰기 */}
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", padding: 20, marginBottom: 24 }}>
            <textarea
              rows={3}
              placeholder="자유롭게 글을 남겨보세요..."
              value={postInput}
              onChange={(e) => setPostInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addPost(); }}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Ctrl+Enter로 빠르게 등록</span>
              <button onClick={addPost} style={{ background: "#2563eb", color: "white", padding: "9px 24px", borderRadius: 9, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>등록</button>
            </div>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "60px 0", fontSize: 15 }}>첫 번째 글을 남겨보세요! ✍️</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map((post) => (
                <div key={post.id} style={{ background: "white", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", padding: "18px 20px" }}>
                  <p style={{ margin: 0, color: "#1e293b", whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 15 }}>{post.text}</p>
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94a3b8" }}>{post.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ─── 유튜브 모달 ──────────────────────────── */}
      {selectedCourse && (
        <div onClick={() => setSelectedCourse(null)} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.8)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 740, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{selectedCourse.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{selectedCourse.description}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} style={{ background: "#f1f5f9", border: "none", width: 34, height: 34, borderRadius: "50%", fontSize: 16, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>✕</button>
            </div>
            <div style={{ aspectRatio: "16/9" }}>
              <iframe src={`https://www.youtube.com/embed/${selectedCourse.youtubeId}?autoplay=1`} style={{ width: "100%", height: "100%", border: "none", display: "block" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 피처 카드 ──────────────────────────────────── */
function FeatureCard({ icon, title, desc, accent, onClick }: { icon: string; title: string; desc: string; accent?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: accent ? "linear-gradient(135deg,#1e40af 0%,#2563eb 100%)" : "white",
        borderRadius: 14, padding: "20px 18px",
        boxShadow: accent ? "0 4px 20px rgba(37,99,235,0.3)" : "0 1px 6px rgba(0,0,0,0.07)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        border: accent ? "none" : "1px solid #f1f5f9",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {onClick && <span style={{ position: "absolute", top: 14, right: 14, color: accent ? "rgba(255,255,255,0.6)" : "#94a3b8", fontSize: 14 }}>↗</span>}
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: accent ? "white" : "#0f172a" }}>{title}</h3>
      <p style={{ fontSize: 13, color: accent ? "#bfdbfe" : "#64748b", margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

/* ─── 강의 카드 (그리드용) ───────────────────────── */
function CourseCard({ course, onPlay, onLike }: { course: Course; onPlay: () => void; onLike: () => void }) {
  const badge = LEVEL_BADGES[course.level] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #f1f5f9", transition: "box-shadow 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 8px rgba(0,0,0,0.07)"; }}
    >
      <button onClick={onPlay} style={{ display: "block", width: "100%", aspectRatio: "16/9", border: "none", padding: 0, cursor: "pointer", overflow: "hidden", position: "relative", background: "#dbeafe" }}>
        <img src={`https://img.youtube.com/vi/${course.youtubeId}/mqdefault.jpg`} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0)"; }}
        >
          <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.95)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", opacity: 0, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
          >
            <span style={{ fontSize: 16, paddingLeft: 3 }}>▶</span>
          </div>
        </div>
      </button>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{course.level}</span>
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>{course.title}</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b", flex: 1, lineHeight: 1.5 }}>{course.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onPlay} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>▶ 재생</button>
          <button onClick={onLike} style={{ background: "none", border: "1px solid #fce7f3", color: "#f43f5e", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>❤️ {course.likes}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── 강의 리스트 아이템 ─────────────────────────── */
function CourseListItem({ course, onPlay, onLike }: { course: Course; onPlay: () => void; onLike: () => void }) {
  const badge = LEVEL_BADGES[course.level] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <div style={{ background: "white", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", border: "1px solid #f1f5f9" }}>
      <button onClick={onPlay} style={{ flexShrink: 0, width: 110, aspectRatio: "16/9", borderRadius: 10, overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}>
        <img src={`https://img.youtube.com/vi/${course.youtubeId}/mqdefault.jpg`} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>{course.level}</span>
        </div>
        <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onPlay} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>▶ 재생</button>
        <button onClick={onLike} style={{ background: "none", border: "1px solid #fce7f3", color: "#f43f5e", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>❤️ {course.likes}</button>
      </div>
    </div>
  );
}
