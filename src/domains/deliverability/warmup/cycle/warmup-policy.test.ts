import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupPolicy } from "./warmup-policy.js";

test("WarmupPolicy starts in planned", () => {
  const item = newWarmupPolicy("code-123", "name-659");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupPolicy moves to scheduled", () => {
  const item = newWarmupPolicy("code-123", "name-659");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WarmupPolicy rejects moves from cancelled", () => {
  const item = newWarmupPolicy("code-123", "name-659");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
