import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedTierNoticeView, toWeightedTierNoticeViews } from "./weighted-tier-notice-view.js";
import { newWeightedTierNotice } from "./weighted-tier-notice.js";

test("WeightedTierNoticeView shows the status in capitals", () => {
  const item = newWeightedTierNotice("code-732", "name-898");
  const view = toWeightedTierNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTierNoticeViews([item, item]).length, 2, "views");
});
