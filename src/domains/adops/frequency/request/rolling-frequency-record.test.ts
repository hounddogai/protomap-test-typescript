import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFrequencyRecord } from "./rolling-frequency-record.js";

test("RollingFrequencyRecord starts in draft", () => {
  const item = newRollingFrequencyRecord("code-456", "label-7");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFrequencyRecord moves to pending", () => {
  const item = newRollingFrequencyRecord("code-456", "label-7");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingFrequencyRecord rejects moves from closed", () => {
  const item = newRollingFrequencyRecord("code-456", "label-7");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
