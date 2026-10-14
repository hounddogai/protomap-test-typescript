import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationOverride } from "./escalation-override.js";

test("EscalationOverride starts in requested", () => {
  const item = newEscalationOverride("code-795", "name-784");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationOverride moves to granted", () => {
  const item = newEscalationOverride("code-795", "name-784");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("EscalationOverride rejects moves from expired", () => {
  const item = newEscalationOverride("code-795", "name-784");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
