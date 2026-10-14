import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierCycle } from "./tier-cycle.js";

test("TierCycle starts in draft", () => {
  const item = newTierCycle("code-243", "title-561");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierCycle moves to pending", () => {
  const item = newTierCycle("code-243", "title-561");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TierCycle rejects moves from closed", () => {
  const item = newTierCycle("code-243", "title-561");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
