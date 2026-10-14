import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFrequencyDraftView, toDefaultFrequencyDraftViews } from "./default-frequency-draft-view.js";
import { newDefaultFrequencyDraft } from "./default-frequency-draft.js";

test("DefaultFrequencyDraftView shows the status in capitals", () => {
  const item = newDefaultFrequencyDraft("code-207", "label-734");
  const view = toDefaultFrequencyDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFrequencyDraftViews([item, item]).length, 2, "views");
});
