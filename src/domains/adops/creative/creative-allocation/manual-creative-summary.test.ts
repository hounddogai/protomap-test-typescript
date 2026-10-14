import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreativeSummary } from "./manual-creative-summary.js";

test("ManualCreativeSummary starts in new", () => {
  const item = newManualCreativeSummary("code-251", "title-707");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreativeSummary moves to running", () => {
  const item = newManualCreativeSummary("code-251", "title-707");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ManualCreativeSummary rejects moves from failed", () => {
  const item = newManualCreativeSummary("code-251", "title-707");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
