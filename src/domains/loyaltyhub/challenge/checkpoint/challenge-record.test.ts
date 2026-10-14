import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeRecord } from "./challenge-record.js";

test("ChallengeRecord starts in proposed", () => {
  const item = newChallengeRecord("code-27", "label-47");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeRecord moves to withdrawn", () => {
  const item = newChallengeRecord("code-27", "label-47");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ChallengeRecord rejects moves from withdrawn", () => {
  const item = newChallengeRecord("code-27", "label-47");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
