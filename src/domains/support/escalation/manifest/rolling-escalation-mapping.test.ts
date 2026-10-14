import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingEscalationMapping } from "./rolling-escalation-mapping.js";

test("RollingEscalationMapping starts in planned", () => {
  const item = newRollingEscalationMapping("code-184", "label-643");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingEscalationMapping moves to scheduled", () => {
  const item = newRollingEscalationMapping("code-184", "label-643");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingEscalationMapping rejects moves from cancelled", () => {
  const item = newRollingEscalationMapping("code-184", "label-643");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
