import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSlaCheckpoint } from "./capped-sla-checkpoint.js";

test("CappedSlaCheckpoint starts in planned", () => {
  const item = newCappedSlaCheckpoint("code-653", "title-176");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSlaCheckpoint moves to scheduled", () => {
  const item = newCappedSlaCheckpoint("code-653", "title-176");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedSlaCheckpoint rejects moves from cancelled", () => {
  const item = newCappedSlaCheckpoint("code-653", "title-176");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
