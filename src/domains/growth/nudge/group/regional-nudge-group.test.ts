import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("RegionalNudgeGroup starts in idle", () => {
  const item = newRegionalNudgeGroup("code-601", "title-960");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalNudgeGroup moves to ready", () => {
  const item = newRegionalNudgeGroup("code-601", "title-960");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RegionalNudgeGroup rejects moves from stopped", () => {
  const item = newRegionalNudgeGroup("code-601", "title-960");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
