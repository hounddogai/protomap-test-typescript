import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaProposalView, toSlaProposalViews } from "./sla-proposal-view.js";
import { newSlaProposal } from "./sla-proposal.js";

test("SlaProposalView shows the status in capitals", () => {
  const item = newSlaProposal("code-440", "name-119");
  const view = toSlaProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaProposalViews([item, item]).length, 2, "views");
});
