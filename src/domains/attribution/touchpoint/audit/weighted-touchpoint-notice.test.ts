import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

test("WeightedTouchpointNotice starts in open", () => {
  const item = newWeightedTouchpointNotice("code-714", "name-765");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTouchpointNotice moves to reopened", () => {
  const item = newWeightedTouchpointNotice("code-714", "name-765");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WeightedTouchpointNotice rejects moves from archived", () => {
  const item = newWeightedTouchpointNotice("code-714", "name-765");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
