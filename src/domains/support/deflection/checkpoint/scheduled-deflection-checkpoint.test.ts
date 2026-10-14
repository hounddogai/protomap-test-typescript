import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionCheckpoint } from "./scheduled-deflection-checkpoint.js";

test("ScheduledDeflectionCheckpoint starts in requested", () => {
  const item = newScheduledDeflectionCheckpoint("code-240", "title-573");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionCheckpoint moves to granted", () => {
  const item = newScheduledDeflectionCheckpoint("code-240", "title-573");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledDeflectionCheckpoint rejects moves from expired", () => {
  const item = newScheduledDeflectionCheckpoint("code-240", "title-573");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
