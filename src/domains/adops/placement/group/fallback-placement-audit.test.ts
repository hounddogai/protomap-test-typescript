import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPlacementAudit } from "./fallback-placement-audit.js";

test("FallbackPlacementAudit starts in proposed", () => {
  const item = newFallbackPlacementAudit("code-410", "label-283");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPlacementAudit moves to rejected", () => {
  const item = newFallbackPlacementAudit("code-410", "label-283");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackPlacementAudit rejects moves from withdrawn", () => {
  const item = newFallbackPlacementAudit("code-410", "label-283");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
