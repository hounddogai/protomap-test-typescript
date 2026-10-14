import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupRecord } from "./warmup-record.js";

test("WarmupRecord starts in created", () => {
  const item = newWarmupRecord("code-841", "name-115");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupRecord moves to retired", () => {
  const item = newWarmupRecord("code-841", "name-115");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("WarmupRecord rejects moves from retired", () => {
  const item = newWarmupRecord("code-841", "name-115");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
