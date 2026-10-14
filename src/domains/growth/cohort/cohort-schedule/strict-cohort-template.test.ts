import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCohortTemplate } from "./strict-cohort-template.js";

test("StrictCohortTemplate starts in planned", () => {
  const item = newStrictCohortTemplate("code-787", "name-786");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCohortTemplate moves to scheduled", () => {
  const item = newStrictCohortTemplate("code-787", "name-786");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictCohortTemplate rejects moves from cancelled", () => {
  const item = newStrictCohortTemplate("code-787", "name-786");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
