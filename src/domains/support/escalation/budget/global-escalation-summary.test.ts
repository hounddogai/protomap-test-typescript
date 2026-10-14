import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEscalationSummary } from "./global-escalation-summary.js";

test("GlobalEscalationSummary starts in planned", () => {
  const item = newGlobalEscalationSummary("code-162", "name-957");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEscalationSummary moves to completed", () => {
  const item = newGlobalEscalationSummary("code-162", "name-957");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalEscalationSummary rejects moves from cancelled", () => {
  const item = newGlobalEscalationSummary("code-162", "name-957");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
