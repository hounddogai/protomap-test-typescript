import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalConversionSegment } from "./global-conversion-segment.js";

test("GlobalConversionSegment starts in planned", () => {
  const item = newGlobalConversionSegment("code-972", "title-974");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalConversionSegment moves to in progress", () => {
  const item = newGlobalConversionSegment("code-972", "title-974");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalConversionSegment rejects moves from cancelled", () => {
  const item = newGlobalConversionSegment("code-972", "title-974");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
