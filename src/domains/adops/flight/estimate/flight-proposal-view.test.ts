import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightProposalView, toFlightProposalViews } from "./flight-proposal-view.js";
import { newFlightProposal } from "./flight-proposal.js";

test("FlightProposalView shows the status in capitals", () => {
  const item = newFlightProposal("code-611", "label-508");
  const view = toFlightProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightProposalViews([item, item]).length, 2, "views");
});
