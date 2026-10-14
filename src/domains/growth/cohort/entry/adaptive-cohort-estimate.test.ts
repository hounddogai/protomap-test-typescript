import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("AdaptiveCohortEstimate starts in proposed", () => {
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCohortEstimate moves to approved", () => {
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveCohortEstimate rejects moves from withdrawn", () => {
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
