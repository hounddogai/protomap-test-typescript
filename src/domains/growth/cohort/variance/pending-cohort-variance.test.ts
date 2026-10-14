import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCohortVariance } from "./pending-cohort-variance.js";

test("PendingCohortVariance starts in created", () => {
  const item = newPendingCohortVariance("code-371", "label-402");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCohortVariance moves to published", () => {
  const item = newPendingCohortVariance("code-371", "label-402");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingCohortVariance rejects moves from retired", () => {
  const item = newPendingCohortVariance("code-371", "label-402");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
