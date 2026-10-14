import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("TieredTouchpointSummary starts in requested", () => {
  const item = newTieredTouchpointSummary("code-616", "name-568");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTouchpointSummary moves to revoked", () => {
  const item = newTieredTouchpointSummary("code-616", "name-568");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TieredTouchpointSummary rejects moves from expired", () => {
  const item = newTieredTouchpointSummary("code-616", "name-568");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
