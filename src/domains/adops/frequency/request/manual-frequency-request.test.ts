import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFrequencyRequest } from "./manual-frequency-request.js";

test("ManualFrequencyRequest starts in new", () => {
  const item = newManualFrequencyRequest("code-183", "name-861");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFrequencyRequest moves to queued", () => {
  const item = newManualFrequencyRequest("code-183", "name-861");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualFrequencyRequest rejects moves from failed", () => {
  const item = newManualFrequencyRequest("code-183", "name-861");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
