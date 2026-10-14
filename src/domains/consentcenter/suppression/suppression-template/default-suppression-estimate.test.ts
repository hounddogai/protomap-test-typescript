import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSuppressionEstimate } from "./default-suppression-estimate.js";

test("DefaultSuppressionEstimate starts in draft", () => {
  const item = newDefaultSuppressionEstimate("code-965", "title-793");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSuppressionEstimate moves to suspended", () => {
  const item = newDefaultSuppressionEstimate("code-965", "title-793");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("DefaultSuppressionEstimate rejects moves from closed", () => {
  const item = newDefaultSuppressionEstimate("code-965", "title-793");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
