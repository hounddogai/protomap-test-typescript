import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalEscalationScore } from "./regional-escalation-score.js";

test("RegionalEscalationScore starts in requested", () => {
  const item = newRegionalEscalationScore("code-291", "title-225");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalEscalationScore moves to expired", () => {
  const item = newRegionalEscalationScore("code-291", "title-225");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("RegionalEscalationScore rejects moves from expired", () => {
  const item = newRegionalEscalationScore("code-291", "title-225");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
