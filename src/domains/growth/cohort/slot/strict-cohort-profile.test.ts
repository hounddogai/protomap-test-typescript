import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCohortProfile } from "./strict-cohort-profile.js";

test("StrictCohortProfile starts in draft", () => {
  const item = newStrictCohortProfile("code-471", "name-806");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCohortProfile moves to active", () => {
  const item = newStrictCohortProfile("code-471", "name-806");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StrictCohortProfile rejects moves from closed", () => {
  const item = newStrictCohortProfile("code-471", "name-806");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
