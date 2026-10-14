import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengeOverride } from "./legacy-challenge-override.js";

test("LegacyChallengeOverride starts in created", () => {
  const item = newLegacyChallengeOverride("code-377", "title-992");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengeOverride moves to published", () => {
  const item = newLegacyChallengeOverride("code-377", "title-992");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyChallengeOverride rejects moves from retired", () => {
  const item = newLegacyChallengeOverride("code-377", "title-992");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
