import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalConversionSchedule } from "./regional-conversion-schedule.js";

test("RegionalConversionSchedule starts in draft", () => {
  const item = newRegionalConversionSchedule("code-412", "name-959");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalConversionSchedule moves to active", () => {
  const item = newRegionalConversionSchedule("code-412", "name-959");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RegionalConversionSchedule rejects moves from closed", () => {
  const item = newRegionalConversionSchedule("code-412", "name-959");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
