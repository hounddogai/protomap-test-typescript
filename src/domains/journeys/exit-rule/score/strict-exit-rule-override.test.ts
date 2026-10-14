import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictExitRuleOverride } from "./strict-exit-rule-override.js";

test("StrictExitRuleOverride starts in requested", () => {
  const item = newStrictExitRuleOverride("code-970", "label-752");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictExitRuleOverride moves to revoked", () => {
  const item = newStrictExitRuleOverride("code-970", "label-752");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictExitRuleOverride rejects moves from expired", () => {
  const item = newStrictExitRuleOverride("code-970", "label-752");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
