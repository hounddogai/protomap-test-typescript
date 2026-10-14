import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeTemplate } from "./challenge-template.js";

test("ChallengeTemplate starts in created", () => {
  const item = newChallengeTemplate("code-972", "label-452");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeTemplate moves to published", () => {
  const item = newChallengeTemplate("code-972", "label-452");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ChallengeTemplate rejects moves from retired", () => {
  const item = newChallengeTemplate("code-972", "label-452");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
