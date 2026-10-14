import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationDraft } from "./reputation-draft.js";

test("ReputationDraft starts in proposed", () => {
  const item = newReputationDraft("code-565", "name-286");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationDraft moves to withdrawn", () => {
  const item = newReputationDraft("code-565", "name-286");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ReputationDraft rejects moves from withdrawn", () => {
  const item = newReputationDraft("code-565", "name-286");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
