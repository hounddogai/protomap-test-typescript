import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengeRecord } from "./legacy-challenge-record.js";

test("LegacyChallengeRecord starts in new", () => {
  const item = newLegacyChallengeRecord("code-465", "name-880");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengeRecord moves to queued", () => {
  const item = newLegacyChallengeRecord("code-465", "name-880");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyChallengeRecord rejects moves from failed", () => {
  const item = newLegacyChallengeRecord("code-465", "name-880");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
