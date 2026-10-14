import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFrequencyDraftView, toCappedFrequencyDraftViews } from "./capped-frequency-draft-view.js";
import { newCappedFrequencyDraft } from "./capped-frequency-draft.js";

test("CappedFrequencyDraftView shows the status in capitals", () => {
  const item = newCappedFrequencyDraft("code-419", "title-116");
  const view = toCappedFrequencyDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFrequencyDraftViews([item, item]).length, 2, "views");
});
