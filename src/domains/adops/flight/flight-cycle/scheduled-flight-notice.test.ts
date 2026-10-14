import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFlightNotice } from "./scheduled-flight-notice.js";

test("ScheduledFlightNotice starts in draft", () => {
  const item = newScheduledFlightNotice("code-780", "title-179");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFlightNotice moves to active", () => {
  const item = newScheduledFlightNotice("code-780", "title-179");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledFlightNotice rejects moves from closed", () => {
  const item = newScheduledFlightNotice("code-780", "title-179");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
