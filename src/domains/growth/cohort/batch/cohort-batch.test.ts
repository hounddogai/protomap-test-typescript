import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortBatch } from "./cohort-batch.js";

test("CohortBatch starts in draft", () => {
  const item = newCohortBatch("code-472", "name-693");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortBatch moves to active", () => {
  const item = newCohortBatch("code-472", "name-693");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CohortBatch rejects moves from closed", () => {
  const item = newCohortBatch("code-472", "name-693");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
