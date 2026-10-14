import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditAssignment } from "./credit-assignment.js";

test("CreditAssignment starts in idle", () => {
  const item = newCreditAssignment("code-247", "title-600");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditAssignment moves to stopped", () => {
  const item = newCreditAssignment("code-247", "title-600");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("CreditAssignment rejects moves from stopped", () => {
  const item = newCreditAssignment("code-247", "title-600");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
