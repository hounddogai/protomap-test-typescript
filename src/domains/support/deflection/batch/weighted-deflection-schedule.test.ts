import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

test("WeightedDeflectionSchedule starts in requested", () => {
  const item = newWeightedDeflectionSchedule("code-476", "title-952");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDeflectionSchedule moves to granted", () => {
  const item = newWeightedDeflectionSchedule("code-476", "title-952");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedDeflectionSchedule rejects moves from expired", () => {
  const item = newWeightedDeflectionSchedule("code-476", "title-952");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
