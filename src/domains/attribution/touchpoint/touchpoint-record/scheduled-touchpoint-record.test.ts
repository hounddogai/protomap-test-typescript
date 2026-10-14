import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

test("ScheduledTouchpointRecord starts in requested", () => {
  const item = newScheduledTouchpointRecord("code-691", "label-393");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTouchpointRecord moves to granted", () => {
  const item = newScheduledTouchpointRecord("code-691", "label-393");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledTouchpointRecord rejects moves from expired", () => {
  const item = newScheduledTouchpointRecord("code-691", "label-393");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
