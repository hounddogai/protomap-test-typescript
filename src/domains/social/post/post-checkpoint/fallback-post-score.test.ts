import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPostScore } from "./fallback-post-score.js";

test("FallbackPostScore starts in planned", () => {
  const item = newFallbackPostScore("code-221", "title-810");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPostScore moves to scheduled", () => {
  const item = newFallbackPostScore("code-221", "title-810");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FallbackPostScore rejects moves from cancelled", () => {
  const item = newFallbackPostScore("code-221", "title-810");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
