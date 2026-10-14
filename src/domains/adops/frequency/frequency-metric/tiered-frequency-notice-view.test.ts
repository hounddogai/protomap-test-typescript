import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredFrequencyNoticeView, toTieredFrequencyNoticeViews } from "./tiered-frequency-notice-view.js";
import { newTieredFrequencyNotice } from "./tiered-frequency-notice.js";

test("TieredFrequencyNoticeView shows the status in capitals", () => {
  const item = newTieredFrequencyNotice("code-354", "title-191");
  const view = toTieredFrequencyNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredFrequencyNoticeViews([item, item]).length, 2, "views");
});
