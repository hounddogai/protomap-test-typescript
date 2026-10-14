import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCohortAssignment } from "./strict-cohort-assignment.js";

test("StrictCohortAssignment starts in draft", () => {
  const item = newStrictCohortAssignment("code-768", "name-126");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCohortAssignment moves to suspended", () => {
  const item = newStrictCohortAssignment("code-768", "name-126");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("StrictCohortAssignment rejects moves from closed", () => {
  const item = newStrictCohortAssignment("code-768", "name-126");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
