import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCohortTier } from "./legacy-cohort-tier.js";

test("LegacyCohortTier starts in new", () => {
  const item = newLegacyCohortTier("code-548", "label-800");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCohortTier moves to done", () => {
  const item = newLegacyCohortTier("code-548", "label-800");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LegacyCohortTier rejects moves from failed", () => {
  const item = newLegacyCohortTier("code-548", "label-800");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
