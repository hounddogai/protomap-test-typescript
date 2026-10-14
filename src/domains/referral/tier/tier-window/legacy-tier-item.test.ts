import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTierItem } from "./legacy-tier-item.js";

test("LegacyTierItem starts in requested", () => {
  const item = newLegacyTierItem("code-288", "title-633");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTierItem moves to granted", () => {
  const item = newLegacyTierItem("code-288", "title-633");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyTierItem rejects moves from expired", () => {
  const item = newLegacyTierItem("code-288", "title-633");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
