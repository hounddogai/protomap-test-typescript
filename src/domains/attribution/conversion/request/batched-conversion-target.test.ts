import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionTarget } from "./batched-conversion-target.js";

test("BatchedConversionTarget starts in requested", () => {
  const item = newBatchedConversionTarget("code-942", "name-599");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionTarget moves to granted", () => {
  const item = newBatchedConversionTarget("code-942", "name-599");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedConversionTarget rejects moves from expired", () => {
  const item = newBatchedConversionTarget("code-942", "name-599");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
