import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleEntry } from "./exit-rule-entry.js";

test("ExitRuleEntry starts in requested", () => {
  const item = newExitRuleEntry("code-468", "label-257");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleEntry moves to granted", () => {
  const item = newExitRuleEntry("code-468", "label-257");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ExitRuleEntry rejects moves from expired", () => {
  const item = newExitRuleEntry("code-468", "label-257");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
