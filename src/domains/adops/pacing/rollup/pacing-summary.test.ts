import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingSummary } from "./pacing-summary.js";

test("PacingSummary starts in new", () => {
  const item = newPacingSummary("code-177", "name-505");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingSummary moves to done", () => {
  const item = newPacingSummary("code-177", "name-505");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PacingSummary rejects moves from failed", () => {
  const item = newPacingSummary("code-177", "name-505");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
