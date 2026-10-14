import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelDigest } from "./level-digest.js";

test("LevelDigest starts in proposed", () => {
  const item = newLevelDigest("code-679", "label-785");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelDigest moves to approved", () => {
  const item = newLevelDigest("code-679", "label-785");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LevelDigest rejects moves from withdrawn", () => {
  const item = newLevelDigest("code-679", "label-785");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
