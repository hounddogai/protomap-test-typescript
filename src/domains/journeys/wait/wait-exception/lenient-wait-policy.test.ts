import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWaitPolicy } from "./lenient-wait-policy.js";

test("LenientWaitPolicy starts in idle", () => {
  const item = newLenientWaitPolicy("code-747", "title-80");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWaitPolicy moves to ready", () => {
  const item = newLenientWaitPolicy("code-747", "title-80");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientWaitPolicy rejects moves from stopped", () => {
  const item = newLenientWaitPolicy("code-747", "title-80");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
