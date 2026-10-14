import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientBranchAgreementView, toLenientBranchAgreementViews } from "./lenient-branch-agreement-view.js";
import { newLenientBranchAgreement } from "./lenient-branch-agreement.js";

test("LenientBranchAgreementView shows the status in capitals", () => {
  const item = newLenientBranchAgreement("code-80", "title-86");
  const view = toLenientBranchAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientBranchAgreementViews([item, item]).length, 2, "views");
});
