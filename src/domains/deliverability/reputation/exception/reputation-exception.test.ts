import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationException } from "./reputation-exception.js";

test("ReputationException starts in draft", () => {
  const item = newReputationException("code-429", "label-754");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationException moves to suspended", () => {
  const item = newReputationException("code-429", "label-754");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ReputationException rejects moves from closed", () => {
  const item = newReputationException("code-429", "label-754");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
