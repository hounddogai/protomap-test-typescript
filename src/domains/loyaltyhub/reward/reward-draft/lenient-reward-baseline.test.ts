import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardBaseline } from "./lenient-reward-baseline.js";

test("LenientRewardBaseline starts in planned", () => {
  const item = newLenientRewardBaseline("code-937", "label-120");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardBaseline moves to cancelled", () => {
  const item = newLenientRewardBaseline("code-937", "label-120");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LenientRewardBaseline rejects moves from cancelled", () => {
  const item = newLenientRewardBaseline("code-937", "label-120");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
