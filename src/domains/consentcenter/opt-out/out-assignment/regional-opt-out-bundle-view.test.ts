import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalOptOutBundleView, toRegionalOptOutBundleViews } from "./regional-opt-out-bundle-view.js";
import { newRegionalOptOutBundle } from "./regional-opt-out-bundle.js";

test("RegionalOptOutBundleView shows the status in capitals", () => {
  const item = newRegionalOptOutBundle("code-172", "name-186");
  const view = toRegionalOptOutBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalOptOutBundleViews([item, item]).length, 2, "views");
});
