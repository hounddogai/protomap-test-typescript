import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyMacroProposalView, toLegacyMacroProposalViews } from "./legacy-macro-proposal-view.js";
import { newLegacyMacroProposal } from "./legacy-macro-proposal.js";

test("LegacyMacroProposalView shows the status in capitals", () => {
  const item = newLegacyMacroProposal("code-975", "name-875");
  const view = toLegacyMacroProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyMacroProposalViews([item, item]).length, 2, "views");
});
