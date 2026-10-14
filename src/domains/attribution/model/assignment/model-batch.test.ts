import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelBatch } from "./model-batch.js";

test("ModelBatch starts in created", () => {
  const item = newModelBatch("code-219", "label-144");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelBatch moves to validated", () => {
  const item = newModelBatch("code-219", "label-144");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ModelBatch rejects moves from retired", () => {
  const item = newModelBatch("code-219", "label-144");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
