import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientConversionBatch } from "./lenient-conversion-batch.js";

test("LenientConversionBatch starts in planned", () => {
  const item = newLenientConversionBatch("code-511", "title-118");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientConversionBatch moves to scheduled", () => {
  const item = newLenientConversionBatch("code-511", "title-118");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientConversionBatch rejects moves from cancelled", () => {
  const item = newLenientConversionBatch("code-511", "title-118");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
