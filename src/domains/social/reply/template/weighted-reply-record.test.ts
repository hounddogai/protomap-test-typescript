import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReplyRecord } from "./weighted-reply-record.js";

test("WeightedReplyRecord starts in created", () => {
  const item = newWeightedReplyRecord("code-795", "title-101");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReplyRecord moves to validated", () => {
  const item = newWeightedReplyRecord("code-795", "title-101");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedReplyRecord rejects moves from retired", () => {
  const item = newWeightedReplyRecord("code-795", "title-101");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
