import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionRecord } from "./batched-conversion-record.js";

test("BatchedConversionRecord starts in requested", () => {
  const item = newBatchedConversionRecord("code-763", "label-81");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionRecord moves to granted", () => {
  const item = newBatchedConversionRecord("code-763", "label-81");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedConversionRecord rejects moves from expired", () => {
  const item = newBatchedConversionRecord("code-763", "label-81");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
