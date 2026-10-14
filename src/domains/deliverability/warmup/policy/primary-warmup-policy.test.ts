import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

test("PrimaryWarmupPolicy starts in created", () => {
  const item = newPrimaryWarmupPolicy("code-150", "label-167");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryWarmupPolicy moves to published", () => {
  const item = newPrimaryWarmupPolicy("code-150", "label-167");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryWarmupPolicy rejects moves from retired", () => {
  const item = newPrimaryWarmupPolicy("code-150", "label-167");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
