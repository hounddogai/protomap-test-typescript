import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFrequencyReview } from "./capped-frequency-review.js";

test("CappedFrequencyReview starts in proposed", () => {
  const item = newCappedFrequencyReview("code-742", "label-724");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFrequencyReview moves to withdrawn", () => {
  const item = newCappedFrequencyReview("code-742", "label-724");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("CappedFrequencyReview rejects moves from withdrawn", () => {
  const item = newCappedFrequencyReview("code-742", "label-724");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
