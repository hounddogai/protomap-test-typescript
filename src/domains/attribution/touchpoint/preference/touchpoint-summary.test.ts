import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointSummary } from "./touchpoint-summary.js";

test("TouchpointSummary starts in open", () => {
  const item = newTouchpointSummary("code-694", "label-137");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointSummary moves to reopened", () => {
  const item = newTouchpointSummary("code-694", "label-137");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TouchpointSummary rejects moves from archived", () => {
  const item = newTouchpointSummary("code-694", "label-137");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
