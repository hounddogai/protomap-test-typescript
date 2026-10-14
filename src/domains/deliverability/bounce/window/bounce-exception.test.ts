import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceException } from "./bounce-exception.js";

test("BounceException starts in created", () => {
  const item = newBounceException("code-621", "label-325");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceException moves to validated", () => {
  const item = newBounceException("code-621", "label-325");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BounceException rejects moves from retired", () => {
  const item = newBounceException("code-621", "label-325");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
