import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRequest } from "./reward-request.js";

test("RewardRequest starts in created", () => {
  const item = newRewardRequest("code-94", "label-253");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRequest moves to published", () => {
  const item = newRewardRequest("code-94", "label-253");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RewardRequest rejects moves from retired", () => {
  const item = newRewardRequest("code-94", "label-253");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
