import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionCycle } from "./suppression-cycle.js";

test("SuppressionCycle starts in requested", () => {
  const item = newSuppressionCycle("code-189", "name-593");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionCycle moves to granted", () => {
  const item = newSuppressionCycle("code-189", "name-593");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SuppressionCycle rejects moves from expired", () => {
  const item = newSuppressionCycle("code-189", "name-593");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
