'use client'

import { useState } from 'react'
import { ClearanceData } from '@/lib/types'

interface Props {
  onApply: (data: ClearanceData[]) => void
  onClose: () => void
  currentData: ClearanceData[]
}

type InputMode = 'csv' | 'manual'

export default function ClearanceDataModal({ onApply, onClose, currentData }: Props) {
  const [mode, setMode] = useState<InputMode>('csv')
  const [rows, setRows] = useState<ClearanceData[]>(currentData.length ? currentData : [])
  const [rawText, setRawText] = useState('')
  const [dataType, setDataType] = useState<'style' | 'sku'>('style')
  const [parseError, setParseError] = useState('')

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRawText(ev.target?.result as string)
      setParseError('')
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function parseCsv() {
    setParseError('')
    const lines = rawText.split('\n').filter((l) => l.trim())
    // 헤더 건너뜀
    const dataLines = lines[0]?.toLowerCase().includes('코드') ? lines.slice(1) : lines
    const parsed: ClearanceData[] = []
    for (const line of dataLines) {
      const cols = line.split(',').map((s) => s.trim())
      if (cols.length < 3) continue
      const [key, branchCode, rateStr] = cols
      const rate = parseFloat(rateStr)
      if (!key || !branchCode || isNaN(rate)) continue
      parsed.push({
        key: dataType === 'style' ? key.substring(0, 9) : key,
        type: dataType,
        branchId: branchCode,
        clearanceRate: rate,
      })
    }
    if (!parsed.length) { setParseError('파싱된 데이터가 없습니다. 형식을 확인해주세요.'); return }
    setRows(parsed)
  }

  function addManualRow() {
    setRows((prev) => [...prev, { key: '', type: dataType, branchId: '', clearanceRate: 0 }])
  }

  function updateRow(idx: number, field: keyof ClearanceData, val: string | number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleApply() {
    if (!rows.length) { alert('데이터를 입력해주세요.'); return }
    onApply(rows)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '700px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e3a8a' }}>
            전년 소진율 데이터 입력 · 우선 분배
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
        </div>

        {/* 설명 */}
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#14532D' }}>
          <strong>우선 분배 방식</strong>&nbsp;
          지점의 소진율이 평균보다 높을수록 해당 스타일을 더 많이 배정합니다.<br />
          <strong>스타일 단위</strong>: 동일 스타일코드의 모든 사이즈/컬러에 동일 보정 적용 &nbsp;|&nbsp;
          <strong>SKU 단위</strong>: 해당 품목(컬러+사이즈)에만 적용
        </div>

        {/* 데이터 타입 선택 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>데이터 단위:</span>
          {(['style', 'sku'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="radio" checked={dataType === t} onChange={() => setDataType(t)} />
              {t === 'style' ? '스타일코드 (컬러/사이즈 무관)' : 'SKU (컬러/사이즈 포함)'}
            </label>
          ))}
        </div>

        {/* 입력 모드 탭 */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '12px', borderBottom: '2px solid #E5E7EB' }}>
          {(['csv', 'manual'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? '#1D4ED8' : 'transparent',
              color: mode === m ? '#fff' : '#6B7280',
              border: 'none', padding: '6px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}>
              {m === 'csv' ? 'CSV / 파일 업로드' : '직접 입력'}
            </button>
          ))}
        </div>

        {mode === 'csv' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input type="file" accept=".csv,.txt" onChange={handleCsvFile} style={{ fontSize: '12px' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>형식: 스타일코드,매장코드,소진율(%)</span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setParseError('') }}
              placeholder={'스타일코드,매장코드,소진율\nIKAC2471T,7209,62.5\nIKAC2471T,7204,48.0\n...'}
              style={{ width: '100%', height: '120px', fontSize: '12px', fontFamily: 'monospace', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', resize: 'vertical' }}
            />
            {parseError && <p style={{ color: '#DC2626', fontSize: '12px', margin: '4px 0' }}>{parseError}</p>}
            <button onClick={parseCsv} style={{ ...btnStyleFn('#6B7280'), marginTop: '8px', fontSize: '12px', padding: '6px 16px' }}>
              파싱 → 미리보기
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <div>
            <button onClick={addManualRow} style={{ ...btnStyleFn('#1D4ED8'), fontSize: '12px', padding: '5px 14px', marginBottom: '8px' }}>
              + 행 추가
            </button>
          </div>
        )}

        {/* 파싱/수동 결과 테이블 */}
        {rows.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 6px', fontWeight: 600 }}>
              입력된 데이터: {rows.length}건
            </p>
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: '#1e3a8a' }}>
                    <th style={{ ...th, color: '#fff' }}>스타일/SKU 코드</th>
                    <th style={{ ...th, color: '#fff' }}>매장코드</th>
                    <th style={{ ...th, color: '#fff' }}>소진율 (%)</th>
                    <th style={{ ...th, color: '#fff', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFF' }}>
                      <td style={td}>
                        {mode === 'manual'
                          ? <input value={r.key} onChange={(e) => updateRow(i, 'key', e.target.value)} style={{ ...inpStyle, width: '160px' }} />
                          : <span style={{ fontFamily: 'monospace' }}>{r.key}</span>}
                      </td>
                      <td style={td}>
                        {mode === 'manual'
                          ? <input value={r.branchId} onChange={(e) => updateRow(i, 'branchId', e.target.value)} style={{ ...inpStyle, width: '80px' }} />
                          : r.branchId}
                      </td>
                      <td style={td}>
                        {mode === 'manual'
                          ? <input type="number" value={r.clearanceRate} onChange={(e) => updateRow(i, 'clearanceRate', parseFloat(e.target.value) || 0)} style={{ ...inpStyle, width: '70px' }} />
                          : `${r.clearanceRate.toFixed(1)}%`}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '14px' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setRows([]); onApply([]); onClose() }} style={{ ...btnStyleFn('#DC2626'), fontSize: '12px', padding: '6px 14px' }}>
            소진율 초기화
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={btnStyleFn('#6B7280')}>취소</button>
            <button onClick={handleApply} style={btnStyleFn('#15803D')}>적용</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '7px 10px', border: '1px solid #374151', fontWeight: 700, textAlign: 'center', fontSize: '12px' }
const td: React.CSSProperties = { padding: '5px 8px', border: '1px solid #E5E7EB' }
const inpStyle: React.CSSProperties = { border: '1px solid #D1D5DB', borderRadius: '3px', padding: '2px 6px', fontSize: '12px' }
function btnStyleFn(bg: string): React.CSSProperties {
  return { background: bg, color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
}
