import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFunnelReview } from "./strict-funnel-review.js";

test("StrictFunnelReview starts in draft", () => {
  const item = newStrictFunnelReview("code-502", "title-961");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFunnelReview moves to active", () => {
  const item = newStrictFunnelReview("code-502", "title-961");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StrictFunnelReview rejects moves from closed", () => {
  const item = newStrictFunnelReview("code-502", "title-961");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
