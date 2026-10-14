import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBounceProfileView, toFallbackBounceProfileViews } from "./fallback-bounce-profile-view.js";
import { newFallbackBounceProfile } from "./fallback-bounce-profile.js";

test("FallbackBounceProfileView shows the status in capitals", () => {
  const item = newFallbackBounceProfile("code-856", "name-225");
  const view = toFallbackBounceProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBounceProfileViews([item, item]).length, 2, "views");
});
