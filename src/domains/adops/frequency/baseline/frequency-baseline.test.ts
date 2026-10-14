import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyBaseline } from "./frequency-baseline.js";

test("FrequencyBaseline starts in idle", () => {
  const item = newFrequencyBaseline("code-372", "name-648");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyBaseline moves to warming", () => {
  const item = newFrequencyBaseline("code-372", "name-648");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FrequencyBaseline rejects moves from stopped", () => {
  const item = newFrequencyBaseline("code-372", "name-648");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
