import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderTierView, toSenderTierViews } from "./sender-tier-view.js";
import { newSenderTier } from "./sender-tier.js";

test("SenderTierView shows the status in capitals", () => {
  const item = newSenderTier("code-770", "label-769");
  const view = toSenderTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderTierViews([item, item]).length, 2, "views");
});
