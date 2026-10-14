import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupVariance } from "./warmup-variance.js";

test("WarmupVariance starts in draft", () => {
  const item = newWarmupVariance("code-568", "name-952");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupVariance moves to pending", () => {
  const item = newWarmupVariance("code-568", "name-952");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WarmupVariance rejects moves from closed", () => {
  const item = newWarmupVariance("code-568", "name-952");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
