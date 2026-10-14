import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostSchedule } from "./post-schedule.js";

test("PostSchedule starts in idle", () => {
  const item = newPostSchedule("code-761", "name-453");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostSchedule moves to warming", () => {
  const item = newPostSchedule("code-761", "name-453");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PostSchedule rejects moves from stopped", () => {
  const item = newPostSchedule("code-761", "name-453");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
