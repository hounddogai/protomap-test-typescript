import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBounceTier } from "./capped-bounce-tier.js";

test("CappedBounceTier starts in new", () => {
  const item = newCappedBounceTier("code-101", "name-929");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBounceTier moves to running", () => {
  const item = newCappedBounceTier("code-101", "name-929");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedBounceTier rejects moves from failed", () => {
  const item = newCappedBounceTier("code-101", "name-929");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
