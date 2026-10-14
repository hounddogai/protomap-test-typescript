import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualChallengeBatch } from "./manual-challenge-batch.js";

test("ManualChallengeBatch starts in proposed", () => {
  const item = newManualChallengeBatch("code-674", "title-615");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualChallengeBatch moves to approved", () => {
  const item = newManualChallengeBatch("code-674", "title-615");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ManualChallengeBatch rejects moves from withdrawn", () => {
  const item = newManualChallengeBatch("code-674", "title-615");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
