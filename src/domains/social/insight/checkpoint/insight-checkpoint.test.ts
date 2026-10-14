import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightCheckpoint } from "./insight-checkpoint.js";

test("InsightCheckpoint starts in planned", () => {
  const item = newInsightCheckpoint("code-825", "name-366");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightCheckpoint moves to completed", () => {
  const item = newInsightCheckpoint("code-825", "name-366");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("InsightCheckpoint rejects moves from cancelled", () => {
  const item = newInsightCheckpoint("code-825", "name-366");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
