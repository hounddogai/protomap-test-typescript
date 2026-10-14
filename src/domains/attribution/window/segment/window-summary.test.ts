import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowSummary } from "./window-summary.js";

test("WindowSummary starts in new", () => {
  const item = newWindowSummary("code-868", "label-107");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowSummary moves to queued", () => {
  const item = newWindowSummary("code-868", "label-107");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WindowSummary rejects moves from failed", () => {
  const item = newWindowSummary("code-868", "label-107");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
