import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingMacroBaseline } from "./pending-macro-baseline.js";

test("PendingMacroBaseline starts in new", () => {
  const item = newPendingMacroBaseline("code-670", "name-784");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingMacroBaseline moves to queued", () => {
  const item = newPendingMacroBaseline("code-670", "name-784");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingMacroBaseline rejects moves from failed", () => {
  const item = newPendingMacroBaseline("code-670", "name-784");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
