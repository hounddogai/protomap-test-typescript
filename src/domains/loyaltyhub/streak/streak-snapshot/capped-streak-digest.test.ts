import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStreakDigest } from "./capped-streak-digest.js";

test("CappedStreakDigest starts in created", () => {
  const item = newCappedStreakDigest("code-978", "title-507");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStreakDigest moves to validated", () => {
  const item = newCappedStreakDigest("code-978", "title-507");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedStreakDigest rejects moves from retired", () => {
  const item = newCappedStreakDigest("code-978", "title-507");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
