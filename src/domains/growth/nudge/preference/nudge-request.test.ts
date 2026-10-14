import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeRequest } from "./nudge-request.js";

test("NudgeRequest starts in draft", () => {
  const item = newNudgeRequest("code-437", "name-228");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeRequest moves to pending", () => {
  const item = newNudgeRequest("code-437", "name-228");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("NudgeRequest rejects moves from closed", () => {
  const item = newNudgeRequest("code-437", "name-228");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
