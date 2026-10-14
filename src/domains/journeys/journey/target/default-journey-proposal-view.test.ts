import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultJourneyProposalView, toDefaultJourneyProposalViews } from "./default-journey-proposal-view.js";
import { newDefaultJourneyProposal } from "./default-journey-proposal.js";

test("DefaultJourneyProposalView shows the status in capitals", () => {
  const item = newDefaultJourneyProposal("code-654", "label-21");
  const view = toDefaultJourneyProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultJourneyProposalViews([item, item]).length, 2, "views");
});
