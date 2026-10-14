import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationEstimate } from "./escalation-estimate.js";

test("EscalationEstimate starts in requested", () => {
  const item = newEscalationEstimate("code-3", "name-540");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationEstimate moves to granted", () => {
  const item = newEscalationEstimate("code-3", "name-540");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("EscalationEstimate rejects moves from expired", () => {
  const item = newEscalationEstimate("code-3", "name-540");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
