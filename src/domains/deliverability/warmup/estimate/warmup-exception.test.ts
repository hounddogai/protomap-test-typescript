import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupException } from "./warmup-exception.js";

test("WarmupException starts in new", () => {
  const item = newWarmupException("code-153", "name-525");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupException moves to running", () => {
  const item = newWarmupException("code-153", "name-525");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WarmupException rejects moves from failed", () => {
  const item = newWarmupException("code-153", "name-525");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
