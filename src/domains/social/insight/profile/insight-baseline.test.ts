import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightBaseline } from "./insight-baseline.js";

test("InsightBaseline starts in created", () => {
  const item = newInsightBaseline("code-608", "name-769");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightBaseline moves to validated", () => {
  const item = newInsightBaseline("code-608", "name-769");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("InsightBaseline rejects moves from retired", () => {
  const item = newInsightBaseline("code-608", "name-769");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
