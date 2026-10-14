import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleTier } from "./exit-rule-tier.js";

test("ExitRuleTier starts in draft", () => {
  const item = newExitRuleTier("code-87", "label-4");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleTier moves to pending", () => {
  const item = newExitRuleTier("code-87", "label-4");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ExitRuleTier rejects moves from closed", () => {
  const item = newExitRuleTier("code-87", "label-4");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
