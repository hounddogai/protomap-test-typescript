import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPacingTarget } from "./tiered-pacing-target.js";

test("TieredPacingTarget starts in requested", () => {
  const item = newTieredPacingTarget("code-74", "title-802");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPacingTarget moves to granted", () => {
  const item = newTieredPacingTarget("code-74", "title-802");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredPacingTarget rejects moves from expired", () => {
  const item = newTieredPacingTarget("code-74", "title-802");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
