import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchAgreementView, toBranchAgreementViews } from "./branch-agreement-view.js";
import { newBranchAgreement } from "./branch-agreement.js";

test("BranchAgreementView shows the status in capitals", () => {
  const item = newBranchAgreement("code-612", "title-740");
  const view = toBranchAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchAgreementViews([item, item]).length, 2, "views");
});
