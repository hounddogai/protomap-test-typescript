import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCsatDraftView, toFallbackCsatDraftViews } from "./fallback-csat-draft-view.js";
import { newFallbackCsatDraft } from "./fallback-csat-draft.js";

test("FallbackCsatDraftView shows the status in capitals", () => {
  const item = newFallbackCsatDraft("code-58", "name-296");
  const view = toFallbackCsatDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCsatDraftViews([item, item]).length, 2, "views");
});
