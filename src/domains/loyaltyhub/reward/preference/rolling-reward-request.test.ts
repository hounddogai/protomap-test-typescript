import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRewardRequest } from "./rolling-reward-request.js";

test("RollingRewardRequest starts in proposed", () => {
  const item = newRollingRewardRequest("code-273", "label-794");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRewardRequest moves to rejected", () => {
  const item = newRollingRewardRequest("code-273", "label-794");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingRewardRequest rejects moves from withdrawn", () => {
  const item = newRollingRewardRequest("code-273", "label-794");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
