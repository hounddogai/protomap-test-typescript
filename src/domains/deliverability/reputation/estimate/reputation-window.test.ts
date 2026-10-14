import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationWindow } from "./reputation-window.js";

test("ReputationWindow starts in new", () => {
  const item = newReputationWindow("code-381", "label-615");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationWindow moves to queued", () => {
  const item = newReputationWindow("code-381", "label-615");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ReputationWindow rejects moves from failed", () => {
  const item = newReputationWindow("code-381", "label-615");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
