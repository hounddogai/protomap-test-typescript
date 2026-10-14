import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCreditNoticeView, toFallbackCreditNoticeViews } from "./fallback-credit-notice-view.js";
import { newFallbackCreditNotice } from "./fallback-credit-notice.js";

test("FallbackCreditNoticeView shows the status in capitals", () => {
  const item = newFallbackCreditNotice("code-959", "name-434");
  const view = toFallbackCreditNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreditNoticeViews([item, item]).length, 2, "views");
});
