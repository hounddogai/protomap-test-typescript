import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedDoubleOptInBundleView, toCappedDoubleOptInBundleViews } from "./capped-double-opt-in-bundle-view.js";
import { newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("CappedDoubleOptInBundleView shows the status in capitals", () => {
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  const view = toCappedDoubleOptInBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedDoubleOptInBundleViews([item, item]).length, 2, "views");
});
