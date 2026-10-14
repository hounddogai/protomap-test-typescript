import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("ScheduledWindowBatch starts in requested", () => {
  const item = newScheduledWindowBatch("code-601", "label-462");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWindowBatch moves to expired", () => {
  const item = newScheduledWindowBatch("code-601", "label-462");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledWindowBatch rejects moves from expired", () => {
  const item = newScheduledWindowBatch("code-601", "label-462");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
