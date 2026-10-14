import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelDraftView, toFunnelDraftViews } from "./funnel-draft-view.js";
import { newFunnelDraft } from "./funnel-draft.js";

test("FunnelDraftView shows the status in capitals", () => {
  const item = newFunnelDraft("code-170", "name-383");
  const view = toFunnelDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelDraftViews([item, item]).length, 2, "views");
});
