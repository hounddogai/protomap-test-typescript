import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelSchedule } from "./level-schedule.js";

test("LevelSchedule starts in created", () => {
  const item = newLevelSchedule("code-957", "name-630");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelSchedule moves to validated", () => {
  const item = newLevelSchedule("code-957", "name-630");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LevelSchedule rejects moves from retired", () => {
  const item = newLevelSchedule("code-957", "name-630");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
