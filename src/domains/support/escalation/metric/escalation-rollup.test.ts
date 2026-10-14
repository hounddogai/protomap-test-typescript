import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationRollup } from "./escalation-rollup.js";

test("EscalationRollup starts in planned", () => {
  const item = newEscalationRollup("code-513", "name-897");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationRollup moves to in progress", () => {
  const item = newEscalationRollup("code-513", "name-897");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EscalationRollup rejects moves from cancelled", () => {
  const item = newEscalationRollup("code-513", "name-897");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
