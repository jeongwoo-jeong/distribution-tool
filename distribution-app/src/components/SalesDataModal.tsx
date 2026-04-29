'use client'

import { useState } from 'react'
import { Branch, BranchSalesData } from '@/lib/types'
import { autoAssignGrades } from '@/lib/calculations'

interface Props {
  branches: Branch[]
  onApply: (updatedBranches: Branch[]) => void
  onClose: () => void
}

export default function SalesDataModal({ branches, onApply, onClose }: Props) {
  const [rows, setRows] = useState<Record<string, { growth: string; recent: string }>>(
    () => Object.fromEntries(branches.map((b) => [b.id, { growth: '', recent: '' }]))
  )
  const [preview, setPreview] = useState<Branch[] | null>(null)

  function update(id: string, field: 'growth' | 'recent', val: string) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }))
    setPreview(null)
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').slice(1)
      const next = { ...rows }
      for (const line of lines) {
        const [code, growth, recent] = line.split(',').map((s) => s.trim())
        const branch = branches.find((b) => b.code === code)
        if (branch) next[branch.id] = { growth: growth ?? '', recent: recent ?? '' }
      }
      setRows(next)
      setPreview(null)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function handlePreview() {
    const salesData: BranchSalesData[] = []
    for (const [branchId, { growth, recent }] of Object.entries(rows)) {
      const g = parseFloat(growth)
      const r = parseFloat(recent)
      if (!isNaN(g) && !isNaN(r)) {
        salesData.push({ branchId, prevYearGrowthRate: g, recentThreeMonthsSales: r })
      }
    }
    if (!salesData.length) { alert('입력된 데이터가 없습니다.'); return }
    setPreview(autoAssignGrades(branches, salesData))
  }

  function handleApply() {
    if (!preview) { handlePreview(); return }
    onApply(preview)
    onClose()
  }

  const GRADE_COLOR: Record<string, string> = {
    A: '#1D4ED8', B: '#15803D', C: '#92400E', D: '#C2410C', E: '#9D174D', X: '#6B7280',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '660px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e3a8a' }}>
            매출 데이터 입력 · 자동 등급 산정
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
        </div>

        {/* 등급 산정 기준 안내 */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#1e3a8a' }}>
          <strong>등급 산정 기준</strong>&nbsp;
          전년 대비 성장률 <strong>30%</strong> + 직전 3개월 매출 <strong>70%</strong> 가중 합산<br />
          상위 10% → A / 11~30% → B / 31~60% → C / 61~90% → D / 하위 10% → E
        </div>

        {/* CSV 업로드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>CSV 업로드:</label>
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ fontSize: '12px' }} />
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>형식: 매장코드,성장률(%),3개월매출(원)</span>
        </div>

        {/* 데이터 입력 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#1e3a8a' }}>
              <th style={{ ...th, color: '#fff' }}>매장코드</th>
              <th style={{ ...th, color: '#fff' }}>지점명</th>
              <th style={{ ...th, color: '#fff' }}>전년 성장률 (%)</th>
              <th style={{ ...th, color: '#fff' }}>직전 3개월 매출 (원)</th>
              <th style={{ ...th, color: '#fff' }}>현재등급</th>
              {preview && <th style={{ ...th, color: '#FDE68A' }}>산정등급</th>}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => {
              const row = rows[b.id]
              const newGrade = preview?.find((p) => p.id === b.id)?.grade
              return (
                <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFF' }}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '11px' }}>{b.code}</td>
                  <td style={td}>{b.name}</td>
                  <td style={td}>
                    <input
                      type="number"
                      value={row.growth}
                      onChange={(e) => update(b.id, 'growth', e.target.value)}
                      placeholder="예: 5.2"
                      style={inputStyle}
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={row.recent}
                      onChange={(e) => update(b.id, 'recent', e.target.value)}
                      placeholder="예: 1500000"
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: GRADE_COLOR[b.grade] ?? '#374151' }}>
                    {b.grade === 'X' ? '제외' : b.grade}
                  </td>
                  {preview && (
                    <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: newGrade ? (GRADE_COLOR[newGrade] ?? '#374151') : '#374151' }}>
                      {newGrade === 'X' ? '제외' : (newGrade ?? '-')}
                      {newGrade && newGrade !== b.grade && (
                        <span style={{ fontSize: '10px', marginLeft: '4px', color: '#DC2626' }}>↑변경</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={handlePreview} style={btnStyle('#6B7280')}>미리보기</button>
          <button onClick={handleApply} style={btnStyle('#15803D')}>등급 적용</button>
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '7px 10px', border: '1px solid #374151', fontWeight: 700, textAlign: 'center', fontSize: '12px' }
const td: React.CSSProperties = { padding: '5px 8px', border: '1px solid #E5E7EB' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #D1D5DB', borderRadius: '3px', padding: '3px 6px', fontSize: '12px', outline: 'none' }
function btnStyle(bg: string): React.CSSProperties {
  return { background: bg, color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
}
