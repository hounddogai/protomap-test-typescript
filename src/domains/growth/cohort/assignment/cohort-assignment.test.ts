import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortAssignment } from "./cohort-assignment.js";

test("CohortAssignment starts in open", () => {
  const item = newCohortAssignment("code-806", "name-203");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortAssignment moves to resolved", () => {
  const item = newCohortAssignment("code-806", "name-203");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CohortAssignment rejects moves from archived", () => {
  const item = newCohortAssignment("code-806", "name-203");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
