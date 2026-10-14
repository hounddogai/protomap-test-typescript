import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionSchedule } from "./conversion-schedule.js";

test("ConversionSchedule starts in draft", () => {
  const item = newConversionSchedule("code-378", "label-562");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionSchedule moves to pending", () => {
  const item = newConversionSchedule("code-378", "label-562");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ConversionSchedule rejects moves from closed", () => {
  const item = newConversionSchedule("code-378", "label-562");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
