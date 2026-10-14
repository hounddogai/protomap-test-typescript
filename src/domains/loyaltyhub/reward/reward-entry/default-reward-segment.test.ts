import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRewardSegment } from "./default-reward-segment.js";

test("DefaultRewardSegment starts in proposed", () => {
  const item = newDefaultRewardSegment("code-464", "title-301");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRewardSegment moves to withdrawn", () => {
  const item = newDefaultRewardSegment("code-464", "title-301");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DefaultRewardSegment rejects moves from withdrawn", () => {
  const item = newDefaultRewardSegment("code-464", "title-301");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
