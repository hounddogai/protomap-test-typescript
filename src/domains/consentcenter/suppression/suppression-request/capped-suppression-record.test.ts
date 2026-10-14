import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSuppressionRecord } from "./capped-suppression-record.js";

test("CappedSuppressionRecord starts in created", () => {
  const item = newCappedSuppressionRecord("code-990", "name-734");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSuppressionRecord moves to validated", () => {
  const item = newCappedSuppressionRecord("code-990", "name-734");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedSuppressionRecord rejects moves from retired", () => {
  const item = newCappedSuppressionRecord("code-990", "name-734");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
