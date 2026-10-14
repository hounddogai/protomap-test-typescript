import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEscalationNotice } from "./legacy-escalation-notice.js";

test("LegacyEscalationNotice starts in planned", () => {
  const item = newLegacyEscalationNotice("code-954", "label-732");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEscalationNotice moves to completed", () => {
  const item = newLegacyEscalationNotice("code-954", "label-732");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LegacyEscalationNotice rejects moves from cancelled", () => {
  const item = newLegacyEscalationNotice("code-954", "label-732");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
