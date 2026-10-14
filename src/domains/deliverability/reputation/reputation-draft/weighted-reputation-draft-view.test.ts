import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedReputationDraftView, toWeightedReputationDraftViews } from "./weighted-reputation-draft-view.js";
import { newWeightedReputationDraft } from "./weighted-reputation-draft.js";

test("WeightedReputationDraftView shows the status in capitals", () => {
  const item = newWeightedReputationDraft("code-802", "name-144");
  const view = toWeightedReputationDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReputationDraftViews([item, item]).length, 2, "views");
});
