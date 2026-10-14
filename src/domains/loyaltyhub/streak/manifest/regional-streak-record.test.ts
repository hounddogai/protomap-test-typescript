import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStreakRecord } from "./regional-streak-record.js";

test("RegionalStreakRecord starts in idle", () => {
  const item = newRegionalStreakRecord("code-972", "label-799");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStreakRecord moves to warming", () => {
  const item = newRegionalStreakRecord("code-972", "label-799");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalStreakRecord rejects moves from stopped", () => {
  const item = newRegionalStreakRecord("code-972", "label-799");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
