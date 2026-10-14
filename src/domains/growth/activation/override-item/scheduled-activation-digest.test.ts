import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledActivationDigest } from "./scheduled-activation-digest.js";

test("ScheduledActivationDigest starts in new", () => {
  const item = newScheduledActivationDigest("code-634", "name-428");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledActivationDigest moves to queued", () => {
  const item = newScheduledActivationDigest("code-634", "name-428");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledActivationDigest rejects moves from failed", () => {
  const item = newScheduledActivationDigest("code-634", "name-428");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
