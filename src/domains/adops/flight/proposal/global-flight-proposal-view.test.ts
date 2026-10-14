import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFlightProposalView, toGlobalFlightProposalViews } from "./global-flight-proposal-view.js";
import { newGlobalFlightProposal } from "./global-flight-proposal.js";

test("GlobalFlightProposalView shows the status in capitals", () => {
  const item = newGlobalFlightProposal("code-213", "name-413");
  const view = toGlobalFlightProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFlightProposalViews([item, item]).length, 2, "views");
});
