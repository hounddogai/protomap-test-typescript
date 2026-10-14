import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInMilestone } from "./double-opt-in-milestone.js";

test("DoubleOptInMilestone starts in idle", () => {
  const item = newDoubleOptInMilestone("code-474", "name-949");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInMilestone moves to draining", () => {
  const item = newDoubleOptInMilestone("code-474", "name-949");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("DoubleOptInMilestone rejects moves from stopped", () => {
  const item = newDoubleOptInMilestone("code-474", "name-949");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
