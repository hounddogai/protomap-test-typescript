import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakDigest } from "./streak-digest.js";

test("StreakDigest starts in open", () => {
  const item = newStreakDigest("code-427", "label-285");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakDigest moves to resolved", () => {
  const item = newStreakDigest("code-427", "label-285");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StreakDigest rejects moves from archived", () => {
  const item = newStreakDigest("code-427", "label-285");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
