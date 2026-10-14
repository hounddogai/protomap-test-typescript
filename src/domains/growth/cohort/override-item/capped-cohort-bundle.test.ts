import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCohortBundle } from "./capped-cohort-bundle.js";

test("CappedCohortBundle starts in proposed", () => {
  const item = newCappedCohortBundle("code-113", "name-852");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCohortBundle moves to rejected", () => {
  const item = newCappedCohortBundle("code-113", "name-852");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CappedCohortBundle rejects moves from withdrawn", () => {
  const item = newCappedCohortBundle("code-113", "name-852");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
