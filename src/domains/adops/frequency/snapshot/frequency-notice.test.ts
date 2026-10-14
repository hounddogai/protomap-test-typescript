import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyNotice } from "./frequency-notice.js";

test("FrequencyNotice starts in idle", () => {
  const item = newFrequencyNotice("code-883", "label-37");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyNotice moves to ready", () => {
  const item = newFrequencyNotice("code-883", "label-37");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FrequencyNotice rejects moves from stopped", () => {
  const item = newFrequencyNotice("code-883", "label-37");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
