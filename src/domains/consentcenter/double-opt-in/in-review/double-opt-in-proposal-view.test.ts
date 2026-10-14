import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInProposalView, toDoubleOptInProposalViews } from "./double-opt-in-proposal-view.js";
import { newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("DoubleOptInProposalView shows the status in capitals", () => {
  const item = newDoubleOptInProposal("code-537", "title-254");
  const view = toDoubleOptInProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInProposalViews([item, item]).length, 2, "views");
});
