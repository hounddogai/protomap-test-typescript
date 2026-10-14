import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyModelMilestone } from "./legacy-model-milestone.js";

test("LegacyModelMilestone starts in idle", () => {
  const item = newLegacyModelMilestone("code-918", "name-991");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyModelMilestone moves to ready", () => {
  const item = newLegacyModelMilestone("code-918", "name-991");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacyModelMilestone rejects moves from stopped", () => {
  const item = newLegacyModelMilestone("code-918", "name-991");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
