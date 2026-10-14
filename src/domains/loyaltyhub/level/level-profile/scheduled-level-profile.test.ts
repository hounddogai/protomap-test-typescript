import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledLevelProfile } from "./scheduled-level-profile.js";

test("ScheduledLevelProfile starts in requested", () => {
  const item = newScheduledLevelProfile("code-467", "label-831");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledLevelProfile moves to granted", () => {
  const item = newScheduledLevelProfile("code-467", "label-831");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledLevelProfile rejects moves from expired", () => {
  const item = newScheduledLevelProfile("code-467", "label-831");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
