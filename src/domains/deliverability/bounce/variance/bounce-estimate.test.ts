import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceEstimate } from "./bounce-estimate.js";

test("BounceEstimate starts in proposed", () => {
  const item = newBounceEstimate("code-648", "title-878");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceEstimate moves to approved", () => {
  const item = newBounceEstimate("code-648", "title-878");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BounceEstimate rejects moves from withdrawn", () => {
  const item = newBounceEstimate("code-648", "title-878");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
