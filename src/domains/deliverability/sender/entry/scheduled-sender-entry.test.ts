import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("ScheduledSenderEntry starts in planned", () => {
  const item = newScheduledSenderEntry("code-969", "title-457");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSenderEntry moves to in progress", () => {
  const item = newScheduledSenderEntry("code-969", "title-457");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ScheduledSenderEntry rejects moves from cancelled", () => {
  const item = newScheduledSenderEntry("code-969", "title-457");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
