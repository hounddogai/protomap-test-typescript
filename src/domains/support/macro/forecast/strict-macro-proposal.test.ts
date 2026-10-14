import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMacroProposal } from "./strict-macro-proposal.js";

test("StrictMacroProposal starts in requested", () => {
  const item = newStrictMacroProposal("code-440", "name-120");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMacroProposal moves to revoked", () => {
  const item = newStrictMacroProposal("code-440", "name-120");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictMacroProposal rejects moves from expired", () => {
  const item = newStrictMacroProposal("code-440", "name-120");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
