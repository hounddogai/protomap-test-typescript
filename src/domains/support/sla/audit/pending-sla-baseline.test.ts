import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSlaBaseline } from "./pending-sla-baseline.js";

test("PendingSlaBaseline starts in idle", () => {
  const item = newPendingSlaBaseline("code-811", "name-329");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSlaBaseline moves to draining", () => {
  const item = newPendingSlaBaseline("code-811", "name-329");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PendingSlaBaseline rejects moves from stopped", () => {
  const item = newPendingSlaBaseline("code-811", "name-329");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
