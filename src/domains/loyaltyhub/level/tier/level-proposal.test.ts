import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelProposal } from "./level-proposal.js";

test("LevelProposal starts in open", () => {
  const item = newLevelProposal("code-269", "label-654");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelProposal moves to in review", () => {
  const item = newLevelProposal("code-269", "label-654");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LevelProposal rejects moves from archived", () => {
  const item = newLevelProposal("code-269", "label-654");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
