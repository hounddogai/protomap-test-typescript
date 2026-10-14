import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyAdjustment } from "./frequency-adjustment.js";

test("FrequencyAdjustment starts in planned", () => {
  const item = newFrequencyAdjustment("code-125", "name-117");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyAdjustment moves to scheduled", () => {
  const item = newFrequencyAdjustment("code-125", "name-117");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FrequencyAdjustment rejects moves from cancelled", () => {
  const item = newFrequencyAdjustment("code-125", "name-117");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
