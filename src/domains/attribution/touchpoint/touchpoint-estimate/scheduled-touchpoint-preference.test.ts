import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

test("ScheduledTouchpointPreference starts in open", () => {
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTouchpointPreference moves to in review", () => {
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledTouchpointPreference rejects moves from archived", () => {
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
