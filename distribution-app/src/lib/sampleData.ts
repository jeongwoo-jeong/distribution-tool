import { Branch, StyleItem } from './types'

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b01', code: 'LOT-B', name: '롯데백화점 본점', grade: 'A' },
  { id: 'b02', code: 'HYD-A', name: '현대백화점 압구정', grade: 'A' },
  { id: 'b03', code: 'SSG-G', name: '신세계 강남점', grade: 'A' },
  { id: 'b04', code: 'LOT-J', name: '롯데백화점 잠실점', grade: 'B' },
  { id: 'b05', code: 'HYD-M', name: '현대백화점 목동점', grade: 'B' },
  { id: 'b06', code: 'SSG-I', name: '신세계 인천점', grade: 'B' },
  { id: 'b07', code: 'NC-YS', name: 'NC 연수점', grade: 'C' },
  { id: 'b08', code: 'AV-SU', name: '애비뉴 수원점', grade: 'C' },
  { id: 'b09', code: 'LOT-PJ', name: '롯데 평촌점', grade: 'C' },
  { id: 'b10', code: 'ETC-DJ', name: '대전 갤러리아', grade: 'D' },
  { id: 'b11', code: 'ETC-GW', name: '광주 롯데', grade: 'D' },
]

export const INITIAL_STYLES: StyleItem[] = [
  { id: 's01', no: 1, styleCode: 'IK24FW-001', productName: '후드집업', color: '블랙', size: '100', availableStock: 45 },
  { id: 's02', no: 2, styleCode: 'IK24FW-001', productName: '후드집업', color: '블랙', size: '110', availableStock: 38 },
  { id: 's03', no: 3, styleCode: 'IK24FW-001', productName: '후드집업', color: '블랙', size: '120', availableStock: 52 },
  { id: 's04', no: 4, styleCode: 'IK24FW-001', productName: '후드집업', color: '네이비', size: '100', availableStock: 30 },
  { id: 's05', no: 5, styleCode: 'IK24FW-001', productName: '후드집업', color: '네이비', size: '110', availableStock: 41 },
  { id: 's06', no: 6, styleCode: 'IK24FW-002', productName: '맨투맨', color: '그레이', size: '100', availableStock: 60 },
  { id: 's07', no: 7, styleCode: 'IK24FW-002', productName: '맨투맨', color: '그레이', size: '110', availableStock: 55 },
  { id: 's08', no: 8, styleCode: 'IK24FW-002', productName: '맨투맨', color: '그레이', size: '120', availableStock: 48 },
  { id: 's09', no: 9, styleCode: 'IK24FW-002', productName: '맨투맨', color: '화이트', size: '100', availableStock: 33 },
  { id: 's10', no: 10, styleCode: 'IK24FW-003', productName: '조거팬츠', color: '블랙', size: '100', availableStock: 70 },
  { id: 's11', no: 11, styleCode: 'IK24FW-003', productName: '조거팬츠', color: '블랙', size: '110', availableStock: 65 },
  { id: 's12', no: 12, styleCode: 'IK24FW-003', productName: '조거팬츠', color: '블랙', size: '120', availableStock: 58 },
  { id: 's13', no: 13, styleCode: 'IK24FW-004', productName: '패딩자켓', color: '베이지', size: '100', availableStock: 25 },
  { id: 's14', no: 14, styleCode: 'IK24FW-004', productName: '패딩자켓', color: '베이지', size: '110', availableStock: 22 },
  { id: 's15', no: 15, styleCode: 'IK24FW-004', productName: '패딩자켓', color: '핑크', size: '100', availableStock: 18 },
]
