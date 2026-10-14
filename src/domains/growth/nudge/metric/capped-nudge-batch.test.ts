import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeBatch } from "./capped-nudge-batch.js";

test("CappedNudgeBatch starts in planned", () => {
  const item = newCappedNudgeBatch("code-145", "label-687");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeBatch moves to scheduled", () => {
  const item = newCappedNudgeBatch("code-145", "label-687");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedNudgeBatch rejects moves from cancelled", () => {
  const item = newCappedNudgeBatch("code-145", "label-687");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
