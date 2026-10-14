import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatMilestone } from "./csat-milestone.js";

test("CsatMilestone starts in idle", () => {
  const item = newCsatMilestone("code-978", "title-208");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatMilestone moves to stopped", () => {
  const item = newCsatMilestone("code-978", "title-208");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("CsatMilestone rejects moves from stopped", () => {
  const item = newCsatMilestone("code-978", "title-208");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
