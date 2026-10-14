import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortCheckpoint } from "./cohort-checkpoint.js";

test("CohortCheckpoint starts in draft", () => {
  const item = newCohortCheckpoint("code-361", "name-432");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortCheckpoint moves to active", () => {
  const item = newCohortCheckpoint("code-361", "name-432");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CohortCheckpoint rejects moves from closed", () => {
  const item = newCohortCheckpoint("code-361", "name-432");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
