import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationDraftView, toActivationDraftViews } from "./activation-draft-view.js";
import { newActivationDraft } from "./activation-draft.js";

test("ActivationDraftView shows the status in capitals", () => {
  const item = newActivationDraft("code-430", "name-316");
  const view = toActivationDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationDraftViews([item, item]).length, 2, "views");
});
