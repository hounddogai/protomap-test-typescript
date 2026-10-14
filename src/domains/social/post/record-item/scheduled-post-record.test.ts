import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPostRecord } from "./scheduled-post-record.js";

test("ScheduledPostRecord starts in planned", () => {
  const item = newScheduledPostRecord("code-165", "label-80");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPostRecord moves to scheduled", () => {
  const item = newScheduledPostRecord("code-165", "label-80");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledPostRecord rejects moves from cancelled", () => {
  const item = newScheduledPostRecord("code-165", "label-80");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
