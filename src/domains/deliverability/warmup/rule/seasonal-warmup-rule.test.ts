import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupRule } from "./seasonal-warmup-rule.js";

test("SeasonalWarmupRule starts in idle", () => {
  const item = newSeasonalWarmupRule("code-559", "label-672");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupRule moves to draining", () => {
  const item = newSeasonalWarmupRule("code-559", "label-672");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SeasonalWarmupRule rejects moves from stopped", () => {
  const item = newSeasonalWarmupRule("code-559", "label-672");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
