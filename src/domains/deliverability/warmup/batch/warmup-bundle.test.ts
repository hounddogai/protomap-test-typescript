import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupBundle } from "./warmup-bundle.js";

test("WarmupBundle starts in draft", () => {
  const item = newWarmupBundle("code-872", "title-205");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupBundle moves to pending", () => {
  const item = newWarmupBundle("code-872", "title-205");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WarmupBundle rejects moves from closed", () => {
  const item = newWarmupBundle("code-872", "title-205");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
