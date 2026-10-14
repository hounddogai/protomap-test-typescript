import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCsatTarget } from "./adaptive-csat-target.js";

test("AdaptiveCsatTarget starts in planned", () => {
  const item = newAdaptiveCsatTarget("code-863", "name-554");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCsatTarget moves to cancelled", () => {
  const item = newAdaptiveCsatTarget("code-863", "name-554");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("AdaptiveCsatTarget rejects moves from cancelled", () => {
  const item = newAdaptiveCsatTarget("code-863", "name-554");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
