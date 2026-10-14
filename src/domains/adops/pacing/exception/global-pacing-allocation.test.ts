import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPacingAllocation } from "./global-pacing-allocation.js";

test("GlobalPacingAllocation starts in requested", () => {
  const item = newGlobalPacingAllocation("code-146", "name-364");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPacingAllocation moves to granted", () => {
  const item = newGlobalPacingAllocation("code-146", "name-364");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalPacingAllocation rejects moves from expired", () => {
  const item = newGlobalPacingAllocation("code-146", "name-364");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
