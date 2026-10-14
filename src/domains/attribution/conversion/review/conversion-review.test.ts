import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionReview } from "./conversion-review.js";

test("ConversionReview starts in idle", () => {
  const item = newConversionReview("code-524", "label-68");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionReview moves to ready", () => {
  const item = newConversionReview("code-524", "label-68");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ConversionReview rejects moves from stopped", () => {
  const item = newConversionReview("code-524", "label-68");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
