import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCohortBaseline } from "./strict-cohort-baseline.js";

test("StrictCohortBaseline starts in created", () => {
  const item = newStrictCohortBaseline("code-964", "label-862");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCohortBaseline moves to validated", () => {
  const item = newStrictCohortBaseline("code-964", "label-862");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictCohortBaseline rejects moves from retired", () => {
  const item = newStrictCohortBaseline("code-964", "label-862");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
