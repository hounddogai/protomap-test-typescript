import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelReview } from "./funnel-review.js";

test("FunnelReview starts in draft", () => {
  const item = newFunnelReview("code-62", "name-707");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelReview moves to suspended", () => {
  const item = newFunnelReview("code-62", "name-707");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("FunnelReview rejects moves from closed", () => {
  const item = newFunnelReview("code-62", "name-707");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
