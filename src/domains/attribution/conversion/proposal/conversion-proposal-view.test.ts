import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionProposalView, toConversionProposalViews } from "./conversion-proposal-view.js";
import { newConversionProposal } from "./conversion-proposal.js";

test("ConversionProposalView shows the status in capitals", () => {
  const item = newConversionProposal("code-329", "title-356");
  const view = toConversionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionProposalViews([item, item]).length, 2, "views");
});
