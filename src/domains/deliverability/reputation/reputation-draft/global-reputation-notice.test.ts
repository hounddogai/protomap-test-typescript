import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalReputationNotice } from "./global-reputation-notice.js";

test("GlobalReputationNotice starts in new", () => {
  const item = newGlobalReputationNotice("code-750", "title-645");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalReputationNotice moves to running", () => {
  const item = newGlobalReputationNotice("code-750", "title-645");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("GlobalReputationNotice rejects moves from failed", () => {
  const item = newGlobalReputationNotice("code-750", "title-645");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
