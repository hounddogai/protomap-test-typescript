import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPathProfile } from "./tiered-path-profile.js";

test("TieredPathProfile starts in requested", () => {
  const item = newTieredPathProfile("code-773", "label-899");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPathProfile moves to granted", () => {
  const item = newTieredPathProfile("code-773", "label-899");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredPathProfile rejects moves from expired", () => {
  const item = newTieredPathProfile("code-773", "label-899");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
