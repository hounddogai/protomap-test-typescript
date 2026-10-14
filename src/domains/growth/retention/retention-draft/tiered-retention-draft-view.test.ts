import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRetentionDraftView, toTieredRetentionDraftViews } from "./tiered-retention-draft-view.js";
import { newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("TieredRetentionDraftView shows the status in capitals", () => {
  const item = newTieredRetentionDraft("code-252", "name-861");
  const view = toTieredRetentionDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRetentionDraftViews([item, item]).length, 2, "views");
});
