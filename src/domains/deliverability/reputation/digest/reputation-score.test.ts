import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationScore } from "./reputation-score.js";

test("ReputationScore starts in requested", () => {
  const item = newReputationScore("code-336", "label-13");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationScore moves to granted", () => {
  const item = newReputationScore("code-336", "label-13");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReputationScore rejects moves from expired", () => {
  const item = newReputationScore("code-336", "label-13");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
