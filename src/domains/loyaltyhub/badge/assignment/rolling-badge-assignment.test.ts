import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

test("RollingBadgeAssignment starts in requested", () => {
  const item = newRollingBadgeAssignment("code-64", "label-677");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingBadgeAssignment moves to granted", () => {
  const item = newRollingBadgeAssignment("code-64", "label-677");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingBadgeAssignment rejects moves from expired", () => {
  const item = newRollingBadgeAssignment("code-64", "label-677");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
