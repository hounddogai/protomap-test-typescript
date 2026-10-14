import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementSchedule } from "./placement-schedule.js";

test("PlacementSchedule starts in created", () => {
  const item = newPlacementSchedule("code-336", "title-16");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementSchedule moves to validated", () => {
  const item = newPlacementSchedule("code-336", "title-16");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PlacementSchedule rejects moves from retired", () => {
  const item = newPlacementSchedule("code-336", "title-16");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
