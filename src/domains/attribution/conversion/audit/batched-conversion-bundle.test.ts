import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionBundle } from "./batched-conversion-bundle.js";

test("BatchedConversionBundle starts in open", () => {
  const item = newBatchedConversionBundle("code-274", "label-86");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionBundle moves to reopened", () => {
  const item = newBatchedConversionBundle("code-274", "label-86");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BatchedConversionBundle rejects moves from archived", () => {
  const item = newBatchedConversionBundle("code-274", "label-86");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
