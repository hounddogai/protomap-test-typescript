import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgePreference } from "./rolling-nudge-preference.js";

test("RollingNudgePreference starts in requested", () => {
  const item = newRollingNudgePreference("code-939", "label-52");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgePreference moves to granted", () => {
  const item = newRollingNudgePreference("code-939", "label-52");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingNudgePreference rejects moves from expired", () => {
  const item = newRollingNudgePreference("code-939", "label-52");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
