import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

test("LenientPreferenceBaseline starts in planned", () => {
  const item = newLenientPreferenceBaseline("code-721", "title-279");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPreferenceBaseline moves to completed", () => {
  const item = newLenientPreferenceBaseline("code-721", "title-279");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LenientPreferenceBaseline rejects moves from cancelled", () => {
  const item = newLenientPreferenceBaseline("code-721", "title-279");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
