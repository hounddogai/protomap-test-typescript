import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

test("AdaptiveWarmupMapping starts in draft", () => {
  const item = newAdaptiveWarmupMapping("code-217", "name-47");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveWarmupMapping moves to pending", () => {
  const item = newAdaptiveWarmupMapping("code-217", "name-47");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveWarmupMapping rejects moves from closed", () => {
  const item = newAdaptiveWarmupMapping("code-217", "name-47");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
