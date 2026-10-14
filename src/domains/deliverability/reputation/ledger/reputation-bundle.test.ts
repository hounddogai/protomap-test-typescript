import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationBundle } from "./reputation-bundle.js";

test("ReputationBundle starts in draft", () => {
  const item = newReputationBundle("code-623", "label-441");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationBundle moves to active", () => {
  const item = newReputationBundle("code-623", "label-441");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ReputationBundle rejects moves from closed", () => {
  const item = newReputationBundle("code-623", "label-441");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
