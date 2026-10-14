import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReputationDraft } from "./weighted-reputation-draft.js";

test("WeightedReputationDraft starts in open", () => {
  const item = newWeightedReputationDraft("code-802", "name-144");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReputationDraft moves to resolved", () => {
  const item = newWeightedReputationDraft("code-802", "name-144");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WeightedReputationDraft rejects moves from archived", () => {
  const item = newWeightedReputationDraft("code-802", "name-144");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
