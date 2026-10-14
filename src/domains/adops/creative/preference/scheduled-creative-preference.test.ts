import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCreativePreference } from "./scheduled-creative-preference.js";

test("ScheduledCreativePreference starts in draft", () => {
  const item = newScheduledCreativePreference("code-900", "label-582");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCreativePreference moves to active", () => {
  const item = newScheduledCreativePreference("code-900", "label-582");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledCreativePreference rejects moves from closed", () => {
  const item = newScheduledCreativePreference("code-900", "label-582");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
