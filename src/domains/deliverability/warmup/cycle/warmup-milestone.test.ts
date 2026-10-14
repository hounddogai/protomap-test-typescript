import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupMilestone } from "./warmup-milestone.js";

test("WarmupMilestone starts in created", () => {
  const item = newWarmupMilestone("code-222", "label-672");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupMilestone moves to published", () => {
  const item = newWarmupMilestone("code-222", "label-672");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WarmupMilestone rejects moves from retired", () => {
  const item = newWarmupMilestone("code-222", "label-672");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
