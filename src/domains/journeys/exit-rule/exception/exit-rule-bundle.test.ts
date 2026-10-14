import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleBundle } from "./exit-rule-bundle.js";

test("ExitRuleBundle starts in requested", () => {
  const item = newExitRuleBundle("code-428", "name-589");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleBundle moves to granted", () => {
  const item = newExitRuleBundle("code-428", "name-589");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ExitRuleBundle rejects moves from expired", () => {
  const item = newExitRuleBundle("code-428", "name-589");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
