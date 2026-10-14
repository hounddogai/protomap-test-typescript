import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledNudgeRequest } from "./scheduled-nudge-request.js";

test("ScheduledNudgeRequest starts in draft", () => {
  const item = newScheduledNudgeRequest("code-323", "name-607");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledNudgeRequest moves to pending", () => {
  const item = newScheduledNudgeRequest("code-323", "name-607");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledNudgeRequest rejects moves from closed", () => {
  const item = newScheduledNudgeRequest("code-323", "name-607");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
