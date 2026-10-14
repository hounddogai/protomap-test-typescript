import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveProofDraftView, toAdaptiveProofDraftViews } from "./adaptive-proof-draft-view.js";
import { newAdaptiveProofDraft } from "./adaptive-proof-draft.js";

test("AdaptiveProofDraftView shows the status in capitals", () => {
  const item = newAdaptiveProofDraft("code-766", "name-779");
  const view = toAdaptiveProofDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveProofDraftViews([item, item]).length, 2, "views");
});
