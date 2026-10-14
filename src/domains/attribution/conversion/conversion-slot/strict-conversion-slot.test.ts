import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictConversionSlot } from "./strict-conversion-slot.js";

test("StrictConversionSlot starts in requested", () => {
  const item = newStrictConversionSlot("code-824", "title-621");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictConversionSlot moves to granted", () => {
  const item = newStrictConversionSlot("code-824", "title-621");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictConversionSlot rejects moves from expired", () => {
  const item = newStrictConversionSlot("code-824", "title-621");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
