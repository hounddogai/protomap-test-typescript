import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderTier } from "./sender-tier.js";

test("SenderTier starts in created", () => {
  const item = newSenderTier("code-770", "label-769");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderTier moves to validated", () => {
  const item = newSenderTier("code-770", "label-769");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderTier rejects moves from retired", () => {
  const item = newSenderTier("code-770", "label-769");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
