import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchAgreement } from "./branch-agreement.js";

test("BranchAgreement starts in idle", () => {
  const item = newBranchAgreement("code-612", "title-740");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchAgreement moves to ready", () => {
  const item = newBranchAgreement("code-612", "title-740");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BranchAgreement rejects moves from stopped", () => {
  const item = newBranchAgreement("code-612", "title-740");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
