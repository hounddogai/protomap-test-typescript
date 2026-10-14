import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalInsightSegment } from "./global-insight-segment.js";

test("GlobalInsightSegment starts in open", () => {
  const item = newGlobalInsightSegment("code-84", "label-329");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalInsightSegment moves to in review", () => {
  const item = newGlobalInsightSegment("code-84", "label-329");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalInsightSegment rejects moves from archived", () => {
  const item = newGlobalInsightSegment("code-84", "label-329");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
