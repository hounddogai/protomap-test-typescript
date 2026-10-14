import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgePreference } from "./nudge-preference.js";

test("NudgePreference starts in open", () => {
  const item = newNudgePreference("code-658", "name-898");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgePreference moves to resolved", () => {
  const item = newNudgePreference("code-658", "name-898");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("NudgePreference rejects moves from archived", () => {
  const item = newNudgePreference("code-658", "name-898");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
