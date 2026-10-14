import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSenderException } from "./weighted-sender-exception.js";

test("WeightedSenderException starts in draft", () => {
  const item = newWeightedSenderException("code-520", "label-358");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSenderException moves to pending", () => {
  const item = newWeightedSenderException("code-520", "label-358");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedSenderException rejects moves from closed", () => {
  const item = newWeightedSenderException("code-520", "label-358");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
