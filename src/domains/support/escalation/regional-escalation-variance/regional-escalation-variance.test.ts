import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("RegionalEscalationVariance starts in open", () => {
  const item = newRegionalEscalationVariance("code-630", "name-998");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalEscalationVariance moves to resolved", () => {
  const item = newRegionalEscalationVariance("code-630", "name-998");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalEscalationVariance rejects moves from archived", () => {
  const item = newRegionalEscalationVariance("code-630", "name-998");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
