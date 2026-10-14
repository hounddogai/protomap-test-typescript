import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepProposalView, toStepProposalViews } from "./step-proposal-view.js";
import { newStepProposal } from "./step-proposal.js";

test("StepProposalView shows the status in capitals", () => {
  const item = newStepProposal("code-642", "title-592");
  const view = toStepProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepProposalViews([item, item]).length, 2, "views");
});
