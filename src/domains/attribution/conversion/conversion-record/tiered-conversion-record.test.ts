import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredConversionRecord } from "./tiered-conversion-record.js";

test("TieredConversionRecord starts in planned", () => {
  const item = newTieredConversionRecord("code-785", "name-947");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredConversionRecord moves to in progress", () => {
  const item = newTieredConversionRecord("code-785", "name-947");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredConversionRecord rejects moves from cancelled", () => {
  const item = newTieredConversionRecord("code-785", "name-947");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
