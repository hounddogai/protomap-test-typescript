import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledNudgePreference } from "./scheduled-nudge-preference.js";

test("ScheduledNudgePreference starts in created", () => {
  const item = newScheduledNudgePreference("code-687", "label-339");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledNudgePreference moves to validated", () => {
  const item = newScheduledNudgePreference("code-687", "label-339");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledNudgePreference rejects moves from retired", () => {
  const item = newScheduledNudgePreference("code-687", "label-339");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
