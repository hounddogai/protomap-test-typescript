import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionBatch } from "./conversion-batch.js";

test("ConversionBatch starts in requested", () => {
  const item = newConversionBatch("code-222", "label-203");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionBatch moves to granted", () => {
  const item = newConversionBatch("code-222", "label-203");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ConversionBatch rejects moves from expired", () => {
  const item = newConversionBatch("code-222", "label-203");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
