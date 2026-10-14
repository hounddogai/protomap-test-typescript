import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupMilestone } from "./lenient-warmup-milestone.js";

test("LenientWarmupMilestone starts in created", () => {
  const item = newLenientWarmupMilestone("code-383", "name-974");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupMilestone moves to validated", () => {
  const item = newLenientWarmupMilestone("code-383", "name-974");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientWarmupMilestone rejects moves from retired", () => {
  const item = newLenientWarmupMilestone("code-383", "name-974");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
