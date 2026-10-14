import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionDraftView, toConversionDraftViews } from "./conversion-draft-view.js";
import { newConversionDraft } from "./conversion-draft.js";

test("ConversionDraftView shows the status in capitals", () => {
  const item = newConversionDraft("code-237", "label-68");
  const view = toConversionDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionDraftViews([item, item]).length, 2, "views");
});
