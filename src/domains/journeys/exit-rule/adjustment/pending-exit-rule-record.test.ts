import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingExitRuleRecord } from "./pending-exit-rule-record.js";

test("PendingExitRuleRecord starts in requested", () => {
  const item = newPendingExitRuleRecord("code-787", "name-819");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingExitRuleRecord moves to granted", () => {
  const item = newPendingExitRuleRecord("code-787", "name-819");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingExitRuleRecord rejects moves from expired", () => {
  const item = newPendingExitRuleRecord("code-787", "name-819");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
