import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("FallbackExitRuleCycle starts in new", () => {
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackExitRuleCycle moves to failed", () => {
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("FallbackExitRuleCycle rejects moves from failed", () => {
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
