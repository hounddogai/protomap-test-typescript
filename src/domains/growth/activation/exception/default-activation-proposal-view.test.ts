import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultActivationProposalView,
  toDefaultActivationProposalViews,
} from "./default-activation-proposal-view.js";
import { newDefaultActivationProposal } from "./default-activation-proposal.js";

test("DefaultActivationProposalView shows the status in capitals", () => {
  const item = newDefaultActivationProposal("code-593", "title-483");
  const view = toDefaultActivationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultActivationProposalViews([item, item]).length, 2, "views");
});
