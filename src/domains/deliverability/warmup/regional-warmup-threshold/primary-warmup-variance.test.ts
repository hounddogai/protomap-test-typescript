import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryWarmupVariance } from "./primary-warmup-variance.js";

test("PrimaryWarmupVariance starts in idle", () => {
  const item = newPrimaryWarmupVariance("code-921", "name-625");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryWarmupVariance moves to ready", () => {
  const item = newPrimaryWarmupVariance("code-921", "name-625");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PrimaryWarmupVariance rejects moves from stopped", () => {
  const item = newPrimaryWarmupVariance("code-921", "name-625");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
