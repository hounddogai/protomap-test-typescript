import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("RegionalCsatProposal starts in idle", () => {
  const item = newRegionalCsatProposal("code-636", "label-121");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCsatProposal moves to ready", () => {
  const item = newRegionalCsatProposal("code-636", "label-121");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RegionalCsatProposal rejects moves from stopped", () => {
  const item = newRegionalCsatProposal("code-636", "label-121");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
