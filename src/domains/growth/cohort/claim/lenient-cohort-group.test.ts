import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCohortGroup } from "./lenient-cohort-group.js";

test("LenientCohortGroup starts in created", () => {
  const item = newLenientCohortGroup("code-997", "label-896");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCohortGroup moves to retired", () => {
  const item = newLenientCohortGroup("code-997", "label-896");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LenientCohortGroup rejects moves from retired", () => {
  const item = newLenientCohortGroup("code-997", "label-896");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
