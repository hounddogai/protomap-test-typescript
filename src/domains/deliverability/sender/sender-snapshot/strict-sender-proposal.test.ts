import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSenderProposal } from "./strict-sender-proposal.js";

test("StrictSenderProposal starts in created", () => {
  const item = newStrictSenderProposal("code-381", "name-745");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSenderProposal moves to published", () => {
  const item = newStrictSenderProposal("code-381", "name-745");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictSenderProposal rejects moves from retired", () => {
  const item = newStrictSenderProposal("code-381", "name-745");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
