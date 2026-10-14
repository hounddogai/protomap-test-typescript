import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupThreshold } from "./warmup-threshold.js";

test("WarmupThreshold starts in created", () => {
  const item = newWarmupThreshold("code-395", "title-7");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupThreshold moves to published", () => {
  const item = newWarmupThreshold("code-395", "title-7");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WarmupThreshold rejects moves from retired", () => {
  const item = newWarmupThreshold("code-395", "title-7");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
