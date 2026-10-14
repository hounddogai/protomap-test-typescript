import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStepRecord } from "./manual-step-record.js";

test("ManualStepRecord starts in new", () => {
  const item = newManualStepRecord("code-159", "name-94");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStepRecord moves to queued", () => {
  const item = newManualStepRecord("code-159", "name-94");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualStepRecord rejects moves from failed", () => {
  const item = newManualStepRecord("code-159", "name-94");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
