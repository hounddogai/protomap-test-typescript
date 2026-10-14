import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionRecord } from "./suppression-record.js";

test("SuppressionRecord starts in created", () => {
  const item = newSuppressionRecord("code-929", "title-586");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionRecord moves to validated", () => {
  const item = newSuppressionRecord("code-929", "title-586");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SuppressionRecord rejects moves from retired", () => {
  const item = newSuppressionRecord("code-929", "title-586");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
