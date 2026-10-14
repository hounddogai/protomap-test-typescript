import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("SeasonalSuppressionSegment starts in draft", () => {
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSuppressionSegment moves to pending", () => {
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalSuppressionSegment rejects moves from closed", () => {
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
