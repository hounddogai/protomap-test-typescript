import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

test("ScheduledNudgeProfile starts in new", () => {
  const item = newScheduledNudgeProfile("code-978", "label-840");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledNudgeProfile moves to done", () => {
  const item = newScheduledNudgeProfile("code-978", "label-840");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ScheduledNudgeProfile rejects moves from failed", () => {
  const item = newScheduledNudgeProfile("code-978", "label-840");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
