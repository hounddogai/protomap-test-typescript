import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWaitPolicy } from "./global-wait-policy.js";

test("GlobalWaitPolicy starts in draft", () => {
  const item = newGlobalWaitPolicy("code-317", "label-838");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWaitPolicy moves to active", () => {
  const item = newGlobalWaitPolicy("code-317", "label-838");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("GlobalWaitPolicy rejects moves from closed", () => {
  const item = newGlobalWaitPolicy("code-317", "label-838");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
