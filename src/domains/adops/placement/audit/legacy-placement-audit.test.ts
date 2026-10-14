import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPlacementAudit } from "./legacy-placement-audit.js";

test("LegacyPlacementAudit starts in new", () => {
  const item = newLegacyPlacementAudit("code-273", "label-313");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPlacementAudit moves to running", () => {
  const item = newLegacyPlacementAudit("code-273", "label-313");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyPlacementAudit rejects moves from failed", () => {
  const item = newLegacyPlacementAudit("code-273", "label-313");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
