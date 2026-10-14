import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictMentionTierView, toStrictMentionTierViews } from "./strict-mention-tier-view.js";
import { newStrictMentionTier } from "./strict-mention-tier.js";

test("StrictMentionTierView shows the status in capitals", () => {
  const item = newStrictMentionTier("code-234", "title-348");
  const view = toStrictMentionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictMentionTierViews([item, item]).length, 2, "views");
});
