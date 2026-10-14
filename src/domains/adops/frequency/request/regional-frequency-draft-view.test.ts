import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalFrequencyDraftView, toRegionalFrequencyDraftViews } from "./regional-frequency-draft-view.js";
import { newRegionalFrequencyDraft } from "./regional-frequency-draft.js";

test("RegionalFrequencyDraftView shows the status in capitals", () => {
  const item = newRegionalFrequencyDraft("code-735", "name-916");
  const view = toRegionalFrequencyDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalFrequencyDraftViews([item, item]).length, 2, "views");
});
