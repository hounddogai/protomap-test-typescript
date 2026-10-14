import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleMapping } from "./exit-rule-mapping.js";

test("ExitRuleMapping starts in requested", () => {
  const item = newExitRuleMapping("code-4", "title-120");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleMapping moves to revoked", () => {
  const item = newExitRuleMapping("code-4", "title-120");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ExitRuleMapping rejects moves from expired", () => {
  const item = newExitRuleMapping("code-4", "title-120");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
