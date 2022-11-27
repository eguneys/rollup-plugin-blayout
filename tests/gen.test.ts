import { expect, it } from 'vitest'

import { compileFileToJs } from '../src/gen'
import * as fixtures from './_fixture'

it('works', () => {


  expect(compileFileToJs(fixtures.basic)).toBe(fixtures.expected_basic)

})


it.only('dropdown list', () => {

  console.log(compileFileToJs(fixtures.dropdown))
  expect(compileFileToJs(fixtures.dropdown)).toBe(fixtures.expected_dropdown)
})
