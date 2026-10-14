import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPreferenceSegment } from "./manual-preference-segment.js";

test("ManualPreferenceSegment starts in idle", () => {
  const item = newManualPreferenceSegment("code-740", "label-582");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPreferenceSegment moves to ready", () => {
  const item = newManualPreferenceSegment("code-740", "label-582");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualPreferenceSegment rejects moves from stopped", () => {
  const item = newManualPreferenceSegment("code-740", "label-582");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
