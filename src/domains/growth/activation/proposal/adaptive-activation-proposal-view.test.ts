import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveActivationProposalView,
  toAdaptiveActivationProposalViews,
} from "./adaptive-activation-proposal-view.js";
import { newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

test("AdaptiveActivationProposalView shows the status in capitals", () => {
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  const view = toAdaptiveActivationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveActivationProposalViews([item, item]).length, 2, "views");
});
