import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReplyTemplate } from "./weighted-reply-template.js";

test("WeightedReplyTemplate starts in idle", () => {
  const item = newWeightedReplyTemplate("code-625", "name-729");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReplyTemplate moves to warming", () => {
  const item = newWeightedReplyTemplate("code-625", "name-729");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedReplyTemplate rejects moves from stopped", () => {
  const item = newWeightedReplyTemplate("code-625", "name-729");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
