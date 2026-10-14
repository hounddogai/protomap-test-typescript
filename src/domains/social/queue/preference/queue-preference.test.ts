import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueuePreference } from "./queue-preference.js";

test("QueuePreference starts in planned", () => {
  const item = newQueuePreference("code-854", "label-600");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueuePreference moves to scheduled", () => {
  const item = newQueuePreference("code-854", "label-600");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("QueuePreference rejects moves from cancelled", () => {
  const item = newQueuePreference("code-854", "label-600");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
