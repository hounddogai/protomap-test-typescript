import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalStepAudit } from "./global-step-audit.js";

test("GlobalStepAudit starts in planned", () => {
  const item = newGlobalStepAudit("code-898", "label-304");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalStepAudit moves to completed", () => {
  const item = newGlobalStepAudit("code-898", "label-304");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalStepAudit rejects moves from cancelled", () => {
  const item = newGlobalStepAudit("code-898", "label-304");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
