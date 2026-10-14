import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

test("AdaptiveSuppressionMapping starts in draft", () => {
  const item = newAdaptiveSuppressionMapping("code-447", "name-341");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSuppressionMapping moves to active", () => {
  const item = newAdaptiveSuppressionMapping("code-447", "name-341");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveSuppressionMapping rejects moves from closed", () => {
  const item = newAdaptiveSuppressionMapping("code-447", "name-341");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
