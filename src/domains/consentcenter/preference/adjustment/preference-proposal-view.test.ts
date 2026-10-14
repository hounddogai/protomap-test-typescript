import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceProposalView, toPreferenceProposalViews } from "./preference-proposal-view.js";
import { newPreferenceProposal } from "./preference-proposal.js";

test("PreferenceProposalView shows the status in capitals", () => {
  const item = newPreferenceProposal("code-909", "name-994");
  const view = toPreferenceProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceProposalViews([item, item]).length, 2, "views");
});
