import { Branch, StyleItem } from './types'
import rawData from './realData.json'

export const INITIAL_BRANCHES: Branch[] = (rawData.branches as Branch[])

export const INITIAL_STYLES: StyleItem[] = (rawData.styles as StyleItem[])
