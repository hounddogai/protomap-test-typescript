import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortEstimate } from "./cohort-estimate.js";

test("CohortEstimate starts in new", () => {
  const item = newCohortEstimate("code-773", "name-933");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortEstimate moves to queued", () => {
  const item = newCohortEstimate("code-773", "name-933");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CohortEstimate rejects moves from failed", () => {
  const item = newCohortEstimate("code-773", "name-933");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
