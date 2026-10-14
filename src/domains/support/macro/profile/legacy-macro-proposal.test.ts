import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyMacroProposal } from "./legacy-macro-proposal.js";

test("LegacyMacroProposal starts in idle", () => {
  const item = newLegacyMacroProposal("code-975", "name-875");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyMacroProposal moves to ready", () => {
  const item = newLegacyMacroProposal("code-975", "name-875");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacyMacroProposal rejects moves from stopped", () => {
  const item = newLegacyMacroProposal("code-975", "name-875");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
