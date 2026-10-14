import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceOverride } from "./tiered-bounce-override.js";

test("TieredBounceOverride starts in planned", () => {
  const item = newTieredBounceOverride("code-190", "name-383");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceOverride moves to completed", () => {
  const item = newTieredBounceOverride("code-190", "name-383");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredBounceOverride rejects moves from cancelled", () => {
  const item = newTieredBounceOverride("code-190", "name-383");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
