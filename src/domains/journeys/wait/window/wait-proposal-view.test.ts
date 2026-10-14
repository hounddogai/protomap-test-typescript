import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitProposalView, toWaitProposalViews } from "./wait-proposal-view.js";
import { newWaitProposal } from "./wait-proposal.js";

test("WaitProposalView shows the status in capitals", () => {
  const item = newWaitProposal("code-943", "name-671");
  const view = toWaitProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitProposalViews([item, item]).length, 2, "views");
});
