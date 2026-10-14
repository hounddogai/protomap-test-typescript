import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallReview } from "./paywall-review.js";

test("PaywallReview starts in open", () => {
  const item = newPaywallReview("code-383", "title-604");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallReview moves to in review", () => {
  const item = newPaywallReview("code-383", "title-604");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PaywallReview rejects moves from archived", () => {
  const item = newPaywallReview("code-383", "title-604");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
