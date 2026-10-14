import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierPolicy } from "./tier-policy.js";

test("TierPolicy starts in open", () => {
  const item = newTierPolicy("code-866", "label-913");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierPolicy moves to resolved", () => {
  const item = newTierPolicy("code-866", "label-913");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TierPolicy rejects moves from archived", () => {
  const item = newTierPolicy("code-866", "label-913");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
