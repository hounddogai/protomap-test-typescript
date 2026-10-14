import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingOptOutAdjustment } from "./pending-opt-out-adjustment.js";

test("PendingOptOutAdjustment starts in created", () => {
  const item = newPendingOptOutAdjustment("code-169", "label-569");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingOptOutAdjustment moves to published", () => {
  const item = newPendingOptOutAdjustment("code-169", "label-569");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingOptOutAdjustment rejects moves from retired", () => {
  const item = newPendingOptOutAdjustment("code-169", "label-569");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
