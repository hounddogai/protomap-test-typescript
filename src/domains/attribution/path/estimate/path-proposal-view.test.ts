import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathProposalView, toPathProposalViews } from "./path-proposal-view.js";
import { newPathProposal } from "./path-proposal.js";

test("PathProposalView shows the status in capitals", () => {
  const item = newPathProposal("code-32", "name-608");
  const view = toPathProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathProposalViews([item, item]).length, 2, "views");
});
