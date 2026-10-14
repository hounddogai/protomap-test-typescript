import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSlaWindow } from "./scheduled-sla-window.js";

test("ScheduledSlaWindow starts in requested", () => {
  const item = newScheduledSlaWindow("code-591", "title-601");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSlaWindow moves to expired", () => {
  const item = newScheduledSlaWindow("code-591", "title-601");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledSlaWindow rejects moves from expired", () => {
  const item = newScheduledSlaWindow("code-591", "title-601");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
