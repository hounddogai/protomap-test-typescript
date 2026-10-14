import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveConversionSlot } from "./adaptive-conversion-slot.js";

test("AdaptiveConversionSlot starts in draft", () => {
  const item = newAdaptiveConversionSlot("code-947", "name-921");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveConversionSlot moves to active", () => {
  const item = newAdaptiveConversionSlot("code-947", "name-921");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveConversionSlot rejects moves from closed", () => {
  const item = newAdaptiveConversionSlot("code-947", "name-921");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
