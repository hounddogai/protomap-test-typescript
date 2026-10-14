import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInsightSegment } from "./legacy-insight-segment.js";

test("LegacyInsightSegment starts in draft", () => {
  const item = newLegacyInsightSegment("code-339", "title-362");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInsightSegment moves to pending", () => {
  const item = newLegacyInsightSegment("code-339", "title-362");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacyInsightSegment rejects moves from closed", () => {
  const item = newLegacyInsightSegment("code-339", "title-362");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
