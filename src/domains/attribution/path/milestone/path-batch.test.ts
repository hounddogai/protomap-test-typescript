import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathBatch } from "./path-batch.js";

test("PathBatch starts in created", () => {
  const item = newPathBatch("code-990", "label-910");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathBatch moves to validated", () => {
  const item = newPathBatch("code-990", "label-910");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PathBatch rejects moves from retired", () => {
  const item = newPathBatch("code-990", "label-910");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
