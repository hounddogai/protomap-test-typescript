import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostTierView, toPostTierViews } from "./post-tier-view.js";
import { newPostTier } from "./post-tier.js";

test("PostTierView shows the status in capitals", () => {
  const item = newPostTier("code-900", "name-670");
  const view = toPostTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostTierViews([item, item]).length, 2, "views");
});
