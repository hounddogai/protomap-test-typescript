import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLevelVariance } from "./adaptive-level-variance.js";

test("AdaptiveLevelVariance starts in draft", () => {
  const item = newAdaptiveLevelVariance("code-400", "label-770");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLevelVariance moves to closed", () => {
  const item = newAdaptiveLevelVariance("code-400", "label-770");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("AdaptiveLevelVariance rejects moves from closed", () => {
  const item = newAdaptiveLevelVariance("code-400", "label-770");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
