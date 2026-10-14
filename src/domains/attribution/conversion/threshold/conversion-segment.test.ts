import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionSegment } from "./conversion-segment.js";

test("ConversionSegment starts in planned", () => {
  const item = newConversionSegment("code-232", "label-475");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionSegment moves to cancelled", () => {
  const item = newConversionSegment("code-232", "label-475");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ConversionSegment rejects moves from cancelled", () => {
  const item = newConversionSegment("code-232", "label-475");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
