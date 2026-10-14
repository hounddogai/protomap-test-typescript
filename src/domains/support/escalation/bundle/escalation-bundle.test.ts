import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationBundle } from "./escalation-bundle.js";

test("EscalationBundle starts in requested", () => {
  const item = newEscalationBundle("code-717", "label-349");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationBundle moves to expired", () => {
  const item = newEscalationBundle("code-717", "label-349");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("EscalationBundle rejects moves from expired", () => {
  const item = newEscalationBundle("code-717", "label-349");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
