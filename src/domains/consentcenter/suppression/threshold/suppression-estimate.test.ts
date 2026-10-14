import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionEstimate } from "./suppression-estimate.js";

test("SuppressionEstimate starts in planned", () => {
  const item = newSuppressionEstimate("code-256", "name-750");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionEstimate moves to scheduled", () => {
  const item = newSuppressionEstimate("code-256", "name-750");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SuppressionEstimate rejects moves from cancelled", () => {
  const item = newSuppressionEstimate("code-256", "name-750");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
