import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

test("ScheduledCreativeAssignment starts in draft", () => {
  const item = newScheduledCreativeAssignment("code-456", "title-708");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCreativeAssignment moves to active", () => {
  const item = newScheduledCreativeAssignment("code-456", "title-708");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledCreativeAssignment rejects moves from closed", () => {
  const item = newScheduledCreativeAssignment("code-456", "title-708");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
