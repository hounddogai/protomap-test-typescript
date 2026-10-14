import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSuppressionSegment } from "./tiered-suppression-segment.js";

test("TieredSuppressionSegment starts in requested", () => {
  const item = newTieredSuppressionSegment("code-842", "name-655");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSuppressionSegment moves to revoked", () => {
  const item = newTieredSuppressionSegment("code-842", "name-655");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TieredSuppressionSegment rejects moves from expired", () => {
  const item = newTieredSuppressionSegment("code-842", "name-655");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
