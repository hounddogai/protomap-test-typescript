import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedModelGroup } from "./capped-model-group.js";

test("CappedModelGroup starts in created", () => {
  const item = newCappedModelGroup("code-185", "label-323");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedModelGroup moves to validated", () => {
  const item = newCappedModelGroup("code-185", "label-323");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedModelGroup rejects moves from retired", () => {
  const item = newCappedModelGroup("code-185", "label-323");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
