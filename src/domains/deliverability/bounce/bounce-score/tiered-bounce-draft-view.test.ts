import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceDraftView, toTieredBounceDraftViews } from "./tiered-bounce-draft-view.js";
import { newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("TieredBounceDraftView shows the status in capitals", () => {
  const item = newTieredBounceDraft("code-36", "name-410");
  const view = toTieredBounceDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceDraftViews([item, item]).length, 2, "views");
});
