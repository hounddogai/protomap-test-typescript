import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTouchpointSummary } from "./capped-touchpoint-summary.js";

test("CappedTouchpointSummary starts in created", () => {
  const item = newCappedTouchpointSummary("code-682", "title-886");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTouchpointSummary moves to retired", () => {
  const item = newCappedTouchpointSummary("code-682", "title-886");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CappedTouchpointSummary rejects moves from retired", () => {
  const item = newCappedTouchpointSummary("code-682", "title-886");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
