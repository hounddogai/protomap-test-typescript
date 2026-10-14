import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("TieredRewardBundle starts in open", () => {
  const item = newTieredRewardBundle("code-57", "name-596");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardBundle moves to reopened", () => {
  const item = newTieredRewardBundle("code-57", "name-596");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TieredRewardBundle rejects moves from archived", () => {
  const item = newTieredRewardBundle("code-57", "name-596");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
