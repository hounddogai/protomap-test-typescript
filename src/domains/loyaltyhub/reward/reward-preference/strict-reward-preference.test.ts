import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardPreference } from "./strict-reward-preference.js";

test("StrictRewardPreference starts in created", () => {
  const item = newStrictRewardPreference("code-663", "title-232");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardPreference moves to published", () => {
  const item = newStrictRewardPreference("code-663", "title-232");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictRewardPreference rejects moves from retired", () => {
  const item = newStrictRewardPreference("code-663", "title-232");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
