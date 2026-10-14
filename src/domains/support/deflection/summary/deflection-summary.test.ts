import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionSummary } from "./deflection-summary.js";

test("DeflectionSummary starts in draft", () => {
  const item = newDeflectionSummary("code-618", "label-446");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionSummary moves to closed", () => {
  const item = newDeflectionSummary("code-618", "label-446");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("DeflectionSummary rejects moves from closed", () => {
  const item = newDeflectionSummary("code-618", "label-446");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
