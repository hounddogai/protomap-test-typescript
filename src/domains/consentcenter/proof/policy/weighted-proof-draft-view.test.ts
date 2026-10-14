import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedProofDraftView, toWeightedProofDraftViews } from "./weighted-proof-draft-view.js";
import { newWeightedProofDraft } from "./weighted-proof-draft.js";

test("WeightedProofDraftView shows the status in capitals", () => {
  const item = newWeightedProofDraft("code-832", "label-284");
  const view = toWeightedProofDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedProofDraftViews([item, item]).length, 2, "views");
});
