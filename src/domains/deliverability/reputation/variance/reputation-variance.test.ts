import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationVariance } from "./reputation-variance.js";

test("ReputationVariance starts in proposed", () => {
  const item = newReputationVariance("code-326", "name-219");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationVariance moves to approved", () => {
  const item = newReputationVariance("code-326", "name-219");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReputationVariance rejects moves from withdrawn", () => {
  const item = newReputationVariance("code-326", "name-219");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
