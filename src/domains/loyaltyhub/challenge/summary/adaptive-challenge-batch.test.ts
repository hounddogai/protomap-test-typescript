import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("AdaptiveChallengeBatch starts in requested", () => {
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveChallengeBatch moves to granted", () => {
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveChallengeBatch rejects moves from expired", () => {
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
