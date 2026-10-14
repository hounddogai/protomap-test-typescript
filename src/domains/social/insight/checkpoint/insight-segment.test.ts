import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightSegment } from "./insight-segment.js";

test("InsightSegment starts in new", () => {
  const item = newInsightSegment("code-835", "title-302");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightSegment moves to done", () => {
  const item = newInsightSegment("code-835", "title-302");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("InsightSegment rejects moves from failed", () => {
  const item = newInsightSegment("code-835", "title-302");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
