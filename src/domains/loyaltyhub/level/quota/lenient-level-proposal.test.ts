import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLevelProposal } from "./lenient-level-proposal.js";

test("LenientLevelProposal starts in requested", () => {
  const item = newLenientLevelProposal("code-653", "label-259");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLevelProposal moves to granted", () => {
  const item = newLenientLevelProposal("code-653", "label-259");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientLevelProposal rejects moves from expired", () => {
  const item = newLenientLevelProposal("code-653", "label-259");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
