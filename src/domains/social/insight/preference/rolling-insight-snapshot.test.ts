import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingInsightSnapshot } from "./rolling-insight-snapshot.js";

test("RollingInsightSnapshot starts in planned", () => {
  const item = newRollingInsightSnapshot("code-166", "name-787");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingInsightSnapshot moves to completed", () => {
  const item = newRollingInsightSnapshot("code-166", "name-787");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RollingInsightSnapshot rejects moves from cancelled", () => {
  const item = newRollingInsightSnapshot("code-166", "name-787");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
