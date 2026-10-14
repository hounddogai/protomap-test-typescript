import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionSegment } from "./suppression-segment.js";

test("SuppressionSegment starts in draft", () => {
  const item = newSuppressionSegment("code-255", "name-367");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionSegment moves to suspended", () => {
  const item = newSuppressionSegment("code-255", "name-367");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SuppressionSegment rejects moves from closed", () => {
  const item = newSuppressionSegment("code-255", "name-367");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
