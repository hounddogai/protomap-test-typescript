import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleSnapshot } from "./exit-rule-snapshot.js";

test("ExitRuleSnapshot starts in planned", () => {
  const item = newExitRuleSnapshot("code-815", "name-645");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleSnapshot moves to cancelled", () => {
  const item = newExitRuleSnapshot("code-815", "name-645");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ExitRuleSnapshot rejects moves from cancelled", () => {
  const item = newExitRuleSnapshot("code-815", "name-645");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
