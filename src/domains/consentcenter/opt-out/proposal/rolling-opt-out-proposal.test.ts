import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutProposal } from "./rolling-opt-out-proposal.js";

test("RollingOptOutProposal starts in requested", () => {
  const item = newRollingOptOutProposal("code-803", "title-710");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutProposal moves to granted", () => {
  const item = newRollingOptOutProposal("code-803", "title-710");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingOptOutProposal rejects moves from expired", () => {
  const item = newRollingOptOutProposal("code-803", "title-710");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
