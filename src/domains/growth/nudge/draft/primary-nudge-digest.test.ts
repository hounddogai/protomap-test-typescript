import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryNudgeDigest } from "./primary-nudge-digest.js";

test("PrimaryNudgeDigest starts in proposed", () => {
  const item = newPrimaryNudgeDigest("code-727", "title-276");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryNudgeDigest moves to approved", () => {
  const item = newPrimaryNudgeDigest("code-727", "title-276");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryNudgeDigest rejects moves from withdrawn", () => {
  const item = newPrimaryNudgeDigest("code-727", "title-276");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
