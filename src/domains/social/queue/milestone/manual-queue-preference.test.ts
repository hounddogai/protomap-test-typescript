import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualQueuePreference } from "./manual-queue-preference.js";

test("ManualQueuePreference starts in planned", () => {
  const item = newManualQueuePreference("code-188", "label-715");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualQueuePreference moves to cancelled", () => {
  const item = newManualQueuePreference("code-188", "label-715");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ManualQueuePreference rejects moves from cancelled", () => {
  const item = newManualQueuePreference("code-188", "label-715");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
