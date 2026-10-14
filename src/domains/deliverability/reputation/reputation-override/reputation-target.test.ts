import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationTarget } from "./reputation-target.js";

test("ReputationTarget starts in open", () => {
  const item = newReputationTarget("code-798", "title-577");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationTarget moves to in review", () => {
  const item = newReputationTarget("code-798", "title-577");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ReputationTarget rejects moves from archived", () => {
  const item = newReputationTarget("code-798", "title-577");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
