import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardMapping } from "./reward-mapping.js";

test("RewardMapping starts in open", () => {
  const item = newRewardMapping("code-366", "name-182");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardMapping moves to reopened", () => {
  const item = newRewardMapping("code-366", "name-182");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RewardMapping rejects moves from archived", () => {
  const item = newRewardMapping("code-366", "name-182");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
