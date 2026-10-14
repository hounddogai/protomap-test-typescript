import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeSummary } from "./challenge-summary.js";

test("ChallengeSummary starts in created", () => {
  const item = newChallengeSummary("code-561", "title-959");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeSummary moves to published", () => {
  const item = newChallengeSummary("code-561", "title-959");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ChallengeSummary rejects moves from retired", () => {
  const item = newChallengeSummary("code-561", "title-959");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
