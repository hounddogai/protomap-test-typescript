import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("TieredRetentionDraft starts in created", () => {
  const item = newTieredRetentionDraft("code-252", "name-861");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRetentionDraft moves to published", () => {
  const item = newTieredRetentionDraft("code-252", "name-861");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredRetentionDraft rejects moves from retired", () => {
  const item = newTieredRetentionDraft("code-252", "name-861");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
