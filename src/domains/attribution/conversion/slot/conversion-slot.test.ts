import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionSlot } from "./conversion-slot.js";

test("ConversionSlot starts in planned", () => {
  const item = newConversionSlot("code-653", "title-920");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionSlot moves to in progress", () => {
  const item = newConversionSlot("code-653", "title-920");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ConversionSlot rejects moves from cancelled", () => {
  const item = newConversionSlot("code-653", "title-920");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
