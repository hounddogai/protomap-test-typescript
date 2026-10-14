import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalConversionSlot } from "./regional-conversion-slot.js";

test("RegionalConversionSlot starts in open", () => {
  const item = newRegionalConversionSlot("code-187", "title-607");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalConversionSlot moves to resolved", () => {
  const item = newRegionalConversionSlot("code-187", "title-607");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalConversionSlot rejects moves from archived", () => {
  const item = newRegionalConversionSlot("code-187", "title-607");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
