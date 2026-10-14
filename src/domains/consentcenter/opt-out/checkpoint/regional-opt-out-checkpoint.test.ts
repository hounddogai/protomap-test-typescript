import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalOptOutCheckpoint } from "./regional-opt-out-checkpoint.js";

test("RegionalOptOutCheckpoint starts in planned", () => {
  const item = newRegionalOptOutCheckpoint("code-136", "label-421");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalOptOutCheckpoint moves to scheduled", () => {
  const item = newRegionalOptOutCheckpoint("code-136", "label-421");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalOptOutCheckpoint rejects moves from cancelled", () => {
  const item = newRegionalOptOutCheckpoint("code-136", "label-421");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
