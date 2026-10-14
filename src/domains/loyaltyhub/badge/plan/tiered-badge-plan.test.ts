import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBadgePlan } from "./tiered-badge-plan.js";

test("TieredBadgePlan starts in requested", () => {
  const item = newTieredBadgePlan("code-826", "name-985");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBadgePlan moves to granted", () => {
  const item = newTieredBadgePlan("code-826", "name-985");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredBadgePlan rejects moves from expired", () => {
  const item = newTieredBadgePlan("code-826", "name-985");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
