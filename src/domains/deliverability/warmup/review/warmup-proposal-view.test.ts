import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupProposalView, toWarmupProposalViews } from "./warmup-proposal-view.js";
import { newWarmupProposal } from "./warmup-proposal.js";

test("WarmupProposalView shows the status in capitals", () => {
  const item = newWarmupProposal("code-210", "label-146");
  const view = toWarmupProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupProposalViews([item, item]).length, 2, "views");
});
