import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingInsightAssignment } from "./rolling-insight-assignment.js";

test("RollingInsightAssignment starts in requested", () => {
  const item = newRollingInsightAssignment("code-951", "name-551");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingInsightAssignment moves to granted", () => {
  const item = newRollingInsightAssignment("code-951", "name-551");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingInsightAssignment rejects moves from expired", () => {
  const item = newRollingInsightAssignment("code-951", "name-551");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
