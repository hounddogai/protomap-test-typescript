import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

test("RollingWarmupMapping starts in open", () => {
  const item = newRollingWarmupMapping("code-794", "label-700");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWarmupMapping moves to in review", () => {
  const item = newRollingWarmupMapping("code-794", "label-700");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingWarmupMapping rejects moves from archived", () => {
  const item = newRollingWarmupMapping("code-794", "label-700");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
