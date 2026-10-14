import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceAdjustment } from "./preference-adjustment.js";

test("PreferenceAdjustment starts in proposed", () => {
  const item = newPreferenceAdjustment("code-629", "title-690");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceAdjustment moves to approved", () => {
  const item = newPreferenceAdjustment("code-629", "title-690");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PreferenceAdjustment rejects moves from withdrawn", () => {
  const item = newPreferenceAdjustment("code-629", "title-690");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
