import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalReplyAgreementView, toRegionalReplyAgreementViews } from "./regional-reply-agreement-view.js";
import { newRegionalReplyAgreement } from "./regional-reply-agreement.js";

test("RegionalReplyAgreementView shows the status in capitals", () => {
  const item = newRegionalReplyAgreement("code-238", "title-769");
  const view = toRegionalReplyAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalReplyAgreementViews([item, item]).length, 2, "views");
});
