import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("LegacySenderAssignment starts in draft", () => {
  const item = newLegacySenderAssignment("code-935", "name-651");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySenderAssignment moves to active", () => {
  const item = newLegacySenderAssignment("code-935", "name-651");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LegacySenderAssignment rejects moves from closed", () => {
  const item = newLegacySenderAssignment("code-935", "name-651");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
