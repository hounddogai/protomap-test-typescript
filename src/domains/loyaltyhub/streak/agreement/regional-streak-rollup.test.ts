import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStreakRollup } from "./regional-streak-rollup.js";

test("RegionalStreakRollup starts in requested", () => {
  const item = newRegionalStreakRollup("code-352", "label-897");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStreakRollup moves to granted", () => {
  const item = newRegionalStreakRollup("code-352", "label-897");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalStreakRollup rejects moves from expired", () => {
  const item = newRegionalStreakRollup("code-352", "label-897");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
