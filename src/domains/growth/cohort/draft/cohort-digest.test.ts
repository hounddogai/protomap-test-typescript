import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortDigest } from "./cohort-digest.js";

test("CohortDigest starts in planned", () => {
  const item = newCohortDigest("code-67", "title-964");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortDigest moves to in progress", () => {
  const item = newCohortDigest("code-67", "title-964");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CohortDigest rejects moves from cancelled", () => {
  const item = newCohortDigest("code-67", "title-964");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
