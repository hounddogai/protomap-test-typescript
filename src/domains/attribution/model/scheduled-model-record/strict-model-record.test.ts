import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictModelRecord } from "./strict-model-record.js";

test("StrictModelRecord starts in new", () => {
  const item = newStrictModelRecord("code-462", "name-416");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictModelRecord moves to running", () => {
  const item = newStrictModelRecord("code-462", "name-416");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictModelRecord rejects moves from failed", () => {
  const item = newStrictModelRecord("code-462", "name-416");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
