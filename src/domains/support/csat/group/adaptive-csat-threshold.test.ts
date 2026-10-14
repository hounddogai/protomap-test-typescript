import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("AdaptiveCsatThreshold starts in requested", () => {
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCsatThreshold moves to granted", () => {
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveCsatThreshold rejects moves from expired", () => {
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
