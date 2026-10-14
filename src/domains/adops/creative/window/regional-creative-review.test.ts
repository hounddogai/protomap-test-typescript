import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreativeReview } from "./regional-creative-review.js";

test("RegionalCreativeReview starts in planned", () => {
  const item = newRegionalCreativeReview("code-225", "title-226");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreativeReview moves to cancelled", () => {
  const item = newRegionalCreativeReview("code-225", "title-226");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RegionalCreativeReview rejects moves from cancelled", () => {
  const item = newRegionalCreativeReview("code-225", "title-226");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
