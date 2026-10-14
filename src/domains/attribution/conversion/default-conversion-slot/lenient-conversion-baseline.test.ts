import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientConversionBaseline } from "./lenient-conversion-baseline.js";

test("LenientConversionBaseline starts in open", () => {
  const item = newLenientConversionBaseline("code-842", "label-991");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientConversionBaseline moves to in review", () => {
  const item = newLenientConversionBaseline("code-842", "label-991");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientConversionBaseline rejects moves from archived", () => {
  const item = newLenientConversionBaseline("code-842", "label-991");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
