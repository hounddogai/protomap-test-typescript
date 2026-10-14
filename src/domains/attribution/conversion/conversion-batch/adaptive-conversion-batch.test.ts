import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveConversionBatch } from "./adaptive-conversion-batch.js";

test("AdaptiveConversionBatch starts in requested", () => {
  const item = newAdaptiveConversionBatch("code-274", "name-630");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveConversionBatch moves to granted", () => {
  const item = newAdaptiveConversionBatch("code-274", "name-630");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveConversionBatch rejects moves from expired", () => {
  const item = newAdaptiveConversionBatch("code-274", "name-630");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
