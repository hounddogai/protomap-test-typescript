import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFrequencyNotice } from "./global-frequency-notice.js";

test("GlobalFrequencyNotice starts in idle", () => {
  const item = newGlobalFrequencyNotice("code-257", "name-596");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFrequencyNotice moves to warming", () => {
  const item = newGlobalFrequencyNotice("code-257", "name-596");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalFrequencyNotice rejects moves from stopped", () => {
  const item = newGlobalFrequencyNotice("code-257", "name-596");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
