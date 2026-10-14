import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionAdjustment } from "./conversion-adjustment.js";

test("ConversionAdjustment starts in planned", () => {
  const item = newConversionAdjustment("code-861", "title-343");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionAdjustment moves to in progress", () => {
  const item = newConversionAdjustment("code-861", "title-343");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ConversionAdjustment rejects moves from cancelled", () => {
  const item = newConversionAdjustment("code-861", "title-343");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
