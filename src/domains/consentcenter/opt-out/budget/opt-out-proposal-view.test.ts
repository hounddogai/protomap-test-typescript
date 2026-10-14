import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutProposalView, toOptOutProposalViews } from "./opt-out-proposal-view.js";
import { newOptOutProposal } from "./opt-out-proposal.js";

test("OptOutProposalView shows the status in capitals", () => {
  const item = newOptOutProposal("code-483", "label-898");
  const view = toOptOutProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutProposalViews([item, item]).length, 2, "views");
});
