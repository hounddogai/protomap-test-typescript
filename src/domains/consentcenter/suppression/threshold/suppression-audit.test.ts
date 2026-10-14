import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionAudit } from "./suppression-audit.js";

test("SuppressionAudit starts in planned", () => {
  const item = newSuppressionAudit("code-40", "label-928");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionAudit moves to in progress", () => {
  const item = newSuppressionAudit("code-40", "label-928");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SuppressionAudit rejects moves from cancelled", () => {
  const item = newSuppressionAudit("code-40", "label-928");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
