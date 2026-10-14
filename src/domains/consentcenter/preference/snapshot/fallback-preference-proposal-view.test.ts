import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackPreferenceProposalView,
  toFallbackPreferenceProposalViews,
} from "./fallback-preference-proposal-view.js";
import { newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

test("FallbackPreferenceProposalView shows the status in capitals", () => {
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  const view = toFallbackPreferenceProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPreferenceProposalViews([item, item]).length, 2, "views");
});
