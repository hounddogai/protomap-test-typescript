import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierDraft } from "./tier-draft.js";

test("TierDraft starts in open", () => {
  const item = newTierDraft("code-814", "name-842");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierDraft moves to archived", () => {
  const item = newTierDraft("code-814", "name-842");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("TierDraft rejects moves from archived", () => {
  const item = newTierDraft("code-814", "name-842");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
