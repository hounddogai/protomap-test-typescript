import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackTierNoticeView, toFallbackTierNoticeViews } from "./fallback-tier-notice-view.js";
import { newFallbackTierNotice } from "./fallback-tier-notice.js";

test("FallbackTierNoticeView shows the status in capitals", () => {
  const item = newFallbackTierNotice("code-431", "title-898");
  const view = toFallbackTierNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackTierNoticeViews([item, item]).length, 2, "views");
});
