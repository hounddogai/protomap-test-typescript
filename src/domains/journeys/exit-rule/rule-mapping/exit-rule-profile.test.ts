import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleProfile } from "./exit-rule-profile.js";

test("ExitRuleProfile starts in created", () => {
  const item = newExitRuleProfile("code-286", "label-458");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleProfile moves to published", () => {
  const item = newExitRuleProfile("code-286", "label-458");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ExitRuleProfile rejects moves from retired", () => {
  const item = newExitRuleProfile("code-286", "label-458");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
