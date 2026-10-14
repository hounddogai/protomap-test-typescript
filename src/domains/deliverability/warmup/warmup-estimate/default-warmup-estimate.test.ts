import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultWarmupEstimate } from "./default-warmup-estimate.js";

test("DefaultWarmupEstimate starts in planned", () => {
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultWarmupEstimate moves to cancelled", () => {
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DefaultWarmupEstimate rejects moves from cancelled", () => {
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
