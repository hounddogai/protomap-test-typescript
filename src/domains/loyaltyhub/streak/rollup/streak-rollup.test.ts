import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakRollup } from "./streak-rollup.js";

test("StreakRollup starts in requested", () => {
  const item = newStreakRollup("code-177", "name-997");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakRollup moves to granted", () => {
  const item = newStreakRollup("code-177", "name-997");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StreakRollup rejects moves from expired", () => {
  const item = newStreakRollup("code-177", "name-997");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
