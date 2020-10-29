import {
    getFirstDay,
    getDayNames,
    getDayNamesShort,
    getDayNamesMin,
    getMonthNames,
    getMonthNamesShort
} from '../lib/index'

test('getFirstDay', () => {
    expect(getFirstDay()).toBe(1)
})

test('getDayNames', () => {
    expect(getDayNames().length).toBe(7)
})

test('getDayNamesShort', () => {
    expect(getDayNamesShort().length).toBe(7)
})

test('getDayNamesMin', () => {
    expect(getDayNamesMin().length).toBe(7)
})

test('getMonthNames', () => {
    expect(getMonthNames().length).toBe(12)
})

test('getMonthNamesShort', () => {
    expect(getMonthNamesShort().length).toBe(12)
})
