import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWarmupDraftView, toLenientWarmupDraftViews } from "./lenient-warmup-draft-view.js";
import { newLenientWarmupDraft } from "./lenient-warmup-draft.js";

test("LenientWarmupDraftView shows the status in capitals", () => {
  const item = newLenientWarmupDraft("code-896", "label-408");
  const view = toLenientWarmupDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWarmupDraftViews([item, item]).length, 2, "views");
});
