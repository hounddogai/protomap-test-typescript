import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFrequencyReview } from "./strict-frequency-review.js";

test("StrictFrequencyReview starts in requested", () => {
  const item = newStrictFrequencyReview("code-920", "title-21");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFrequencyReview moves to revoked", () => {
  const item = newStrictFrequencyReview("code-920", "title-21");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictFrequencyReview rejects moves from expired", () => {
  const item = newStrictFrequencyReview("code-920", "title-21");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
