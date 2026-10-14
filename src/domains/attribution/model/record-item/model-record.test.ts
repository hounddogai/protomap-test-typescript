import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelRecord } from "./model-record.js";

test("ModelRecord starts in idle", () => {
  const item = newModelRecord("code-910", "name-264");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelRecord moves to draining", () => {
  const item = newModelRecord("code-910", "name-264");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ModelRecord rejects moves from stopped", () => {
  const item = newModelRecord("code-910", "name-264");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
