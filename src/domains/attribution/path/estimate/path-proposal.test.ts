import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathProposal } from "./path-proposal.js";

test("PathProposal starts in open", () => {
  const item = newPathProposal("code-32", "name-608");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathProposal moves to reopened", () => {
  const item = newPathProposal("code-32", "name-608");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PathProposal rejects moves from archived", () => {
  const item = newPathProposal("code-32", "name-608");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
