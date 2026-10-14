import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWarmupMilestone } from "./global-warmup-milestone.js";

test("GlobalWarmupMilestone starts in created", () => {
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWarmupMilestone moves to validated", () => {
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalWarmupMilestone rejects moves from retired", () => {
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
