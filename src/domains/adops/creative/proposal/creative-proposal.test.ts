import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeProposal } from "./creative-proposal.js";

test("CreativeProposal starts in new", () => {
  const item = newCreativeProposal("code-984", "name-594");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeProposal moves to done", () => {
  const item = newCreativeProposal("code-984", "name-594");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CreativeProposal rejects moves from failed", () => {
  const item = newCreativeProposal("code-984", "name-594");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
