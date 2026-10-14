import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientLevelDraftView, toLenientLevelDraftViews } from "./lenient-level-draft-view.js";
import { newLenientLevelDraft } from "./lenient-level-draft.js";

test("LenientLevelDraftView shows the status in capitals", () => {
  const item = newLenientLevelDraft("code-638", "title-819");
  const view = toLenientLevelDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLevelDraftViews([item, item]).length, 2, "views");
});
