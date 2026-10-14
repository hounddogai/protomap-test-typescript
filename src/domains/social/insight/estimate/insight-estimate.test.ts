import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightEstimate } from "./insight-estimate.js";

test("InsightEstimate starts in draft", () => {
  const item = newInsightEstimate("code-656", "label-450");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightEstimate moves to pending", () => {
  const item = newInsightEstimate("code-656", "label-450");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("InsightEstimate rejects moves from closed", () => {
  const item = newInsightEstimate("code-656", "label-450");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
