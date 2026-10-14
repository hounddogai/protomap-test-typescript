import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPacingTemplate } from "./pending-pacing-template.js";

test("PendingPacingTemplate starts in new", () => {
  const item = newPendingPacingTemplate("code-190", "title-984");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPacingTemplate moves to running", () => {
  const item = newPendingPacingTemplate("code-190", "title-984");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingPacingTemplate rejects moves from failed", () => {
  const item = newPendingPacingTemplate("code-190", "title-984");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
