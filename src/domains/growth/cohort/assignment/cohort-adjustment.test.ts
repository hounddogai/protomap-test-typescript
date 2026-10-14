import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortAdjustment } from "./cohort-adjustment.js";

test("CohortAdjustment starts in new", () => {
  const item = newCohortAdjustment("code-698", "name-479");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortAdjustment moves to queued", () => {
  const item = newCohortAdjustment("code-698", "name-479");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CohortAdjustment rejects moves from failed", () => {
  const item = newCohortAdjustment("code-698", "name-479");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
