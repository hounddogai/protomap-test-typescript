import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLevelSegment } from "./adaptive-level-segment.js";

test("AdaptiveLevelSegment starts in proposed", () => {
  const item = newAdaptiveLevelSegment("code-5", "title-12");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLevelSegment moves to approved", () => {
  const item = newAdaptiveLevelSegment("code-5", "title-12");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveLevelSegment rejects moves from withdrawn", () => {
  const item = newAdaptiveLevelSegment("code-5", "title-12");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
