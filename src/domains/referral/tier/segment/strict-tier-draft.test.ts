import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTierDraft } from "./strict-tier-draft.js";

test("StrictTierDraft starts in proposed", () => {
  const item = newStrictTierDraft("code-550", "name-671");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTierDraft moves to rejected", () => {
  const item = newStrictTierDraft("code-550", "name-671");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StrictTierDraft rejects moves from withdrawn", () => {
  const item = newStrictTierDraft("code-550", "name-671");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
