import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCsatReview } from "./lenient-csat-review.js";

test("LenientCsatReview starts in idle", () => {
  const item = newLenientCsatReview("code-332", "label-891");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCsatReview moves to ready", () => {
  const item = newLenientCsatReview("code-332", "label-891");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientCsatReview rejects moves from stopped", () => {
  const item = newLenientCsatReview("code-332", "label-891");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
