import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBadgeProfile } from "./tiered-badge-profile.js";

test("TieredBadgeProfile starts in created", () => {
  const item = newTieredBadgeProfile("code-675", "title-744");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBadgeProfile moves to validated", () => {
  const item = newTieredBadgeProfile("code-675", "title-744");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredBadgeProfile rejects moves from retired", () => {
  const item = newTieredBadgeProfile("code-675", "title-744");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
