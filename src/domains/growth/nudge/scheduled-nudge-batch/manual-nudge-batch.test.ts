import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualNudgeBatch } from "./manual-nudge-batch.js";

test("ManualNudgeBatch starts in planned", () => {
  const item = newManualNudgeBatch("code-240", "label-980");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualNudgeBatch moves to completed", () => {
  const item = newManualNudgeBatch("code-240", "label-980");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ManualNudgeBatch rejects moves from cancelled", () => {
  const item = newManualNudgeBatch("code-240", "label-980");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
