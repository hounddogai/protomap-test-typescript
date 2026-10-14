import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBadgeAssignment } from "./regional-badge-assignment.js";

test("RegionalBadgeAssignment starts in planned", () => {
  const item = newRegionalBadgeAssignment("code-276", "title-719");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBadgeAssignment moves to scheduled", () => {
  const item = newRegionalBadgeAssignment("code-276", "title-719");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalBadgeAssignment rejects moves from cancelled", () => {
  const item = newRegionalBadgeAssignment("code-276", "title-719");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
