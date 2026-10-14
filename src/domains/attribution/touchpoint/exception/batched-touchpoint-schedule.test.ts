import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTouchpointSchedule } from "./batched-touchpoint-schedule.js";

test("BatchedTouchpointSchedule starts in open", () => {
  const item = newBatchedTouchpointSchedule("code-112", "title-948");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTouchpointSchedule moves to in review", () => {
  const item = newBatchedTouchpointSchedule("code-112", "title-948");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedTouchpointSchedule rejects moves from archived", () => {
  const item = newBatchedTouchpointSchedule("code-112", "title-948");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
