import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

test("AdaptiveExitRuleSnapshot starts in draft", () => {
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveExitRuleSnapshot moves to closed", () => {
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("AdaptiveExitRuleSnapshot rejects moves from closed", () => {
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
