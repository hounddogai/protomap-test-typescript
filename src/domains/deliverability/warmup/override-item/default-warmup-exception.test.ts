import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultWarmupException } from "./default-warmup-exception.js";

test("DefaultWarmupException starts in draft", () => {
  const item = newDefaultWarmupException("code-459", "name-89");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultWarmupException moves to pending", () => {
  const item = newDefaultWarmupException("code-459", "name-89");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DefaultWarmupException rejects moves from closed", () => {
  const item = newDefaultWarmupException("code-459", "name-89");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
