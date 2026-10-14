import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointSchedule } from "./touchpoint-schedule.js";

test("TouchpointSchedule starts in draft", () => {
  const item = newTouchpointSchedule("code-678", "name-452");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointSchedule moves to active", () => {
  const item = newTouchpointSchedule("code-678", "name-452");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TouchpointSchedule rejects moves from closed", () => {
  const item = newTouchpointSchedule("code-678", "name-452");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
