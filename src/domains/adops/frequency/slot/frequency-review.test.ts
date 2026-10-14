import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyReview } from "./frequency-review.js";

test("FrequencyReview starts in open", () => {
  const item = newFrequencyReview("code-41", "name-191");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyReview moves to reopened", () => {
  const item = newFrequencyReview("code-41", "name-191");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FrequencyReview rejects moves from archived", () => {
  const item = newFrequencyReview("code-41", "name-191");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
