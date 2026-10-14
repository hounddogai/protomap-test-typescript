import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalFunnelReview } from "./regional-funnel-review.js";

test("RegionalFunnelReview starts in idle", () => {
  const item = newRegionalFunnelReview("code-328", "title-897");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalFunnelReview moves to draining", () => {
  const item = newRegionalFunnelReview("code-328", "title-897");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RegionalFunnelReview rejects moves from stopped", () => {
  const item = newRegionalFunnelReview("code-328", "title-897");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
