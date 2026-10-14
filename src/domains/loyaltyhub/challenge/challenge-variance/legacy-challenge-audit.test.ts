import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengeAudit } from "./legacy-challenge-audit.js";

test("LegacyChallengeAudit starts in new", () => {
  const item = newLegacyChallengeAudit("code-339", "title-482");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengeAudit moves to running", () => {
  const item = newLegacyChallengeAudit("code-339", "title-482");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyChallengeAudit rejects moves from failed", () => {
  const item = newLegacyChallengeAudit("code-339", "title-482");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
