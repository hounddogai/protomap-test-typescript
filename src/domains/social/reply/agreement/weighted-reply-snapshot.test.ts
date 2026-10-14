import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReplySnapshot } from "./weighted-reply-snapshot.js";

test("WeightedReplySnapshot starts in requested", () => {
  const item = newWeightedReplySnapshot("code-781", "name-646");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReplySnapshot moves to expired", () => {
  const item = newWeightedReplySnapshot("code-781", "name-646");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedReplySnapshot rejects moves from expired", () => {
  const item = newWeightedReplySnapshot("code-781", "name-646");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
