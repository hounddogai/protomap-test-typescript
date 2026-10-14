import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeSummary } from "./pending-creative-summary.js";

test("PendingCreativeSummary starts in new", () => {
  const item = newPendingCreativeSummary("code-40", "name-308");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeSummary moves to queued", () => {
  const item = newPendingCreativeSummary("code-40", "name-308");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingCreativeSummary rejects moves from failed", () => {
  const item = newPendingCreativeSummary("code-40", "name-308");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
