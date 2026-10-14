import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPreferenceNotice } from "./lenient-preference-notice.js";

test("LenientPreferenceNotice starts in planned", () => {
  const item = newLenientPreferenceNotice("code-967", "name-218");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPreferenceNotice moves to in progress", () => {
  const item = newLenientPreferenceNotice("code-967", "name-218");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientPreferenceNotice rejects moves from cancelled", () => {
  const item = newLenientPreferenceNotice("code-967", "name-218");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
