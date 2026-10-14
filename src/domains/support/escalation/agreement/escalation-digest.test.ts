import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationDigest } from "./escalation-digest.js";

test("EscalationDigest starts in planned", () => {
  const item = newEscalationDigest("code-969", "label-760");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationDigest moves to in progress", () => {
  const item = newEscalationDigest("code-969", "label-760");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EscalationDigest rejects moves from cancelled", () => {
  const item = newEscalationDigest("code-969", "label-760");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
