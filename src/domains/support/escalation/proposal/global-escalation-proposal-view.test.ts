import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalEscalationProposalView,
  toGlobalEscalationProposalViews,
} from "./global-escalation-proposal-view.js";
import { newGlobalEscalationProposal } from "./global-escalation-proposal.js";

test("GlobalEscalationProposalView shows the status in capitals", () => {
  const item = newGlobalEscalationProposal("code-231", "title-341");
  const view = toGlobalEscalationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalEscalationProposalViews([item, item]).length, 2, "views");
});
