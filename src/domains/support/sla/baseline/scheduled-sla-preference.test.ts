import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSlaPreference } from "./scheduled-sla-preference.js";

test("ScheduledSlaPreference starts in created", () => {
  const item = newScheduledSlaPreference("code-181", "name-915");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSlaPreference moves to published", () => {
  const item = newScheduledSlaPreference("code-181", "name-915");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ScheduledSlaPreference rejects moves from retired", () => {
  const item = newScheduledSlaPreference("code-181", "name-915");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
