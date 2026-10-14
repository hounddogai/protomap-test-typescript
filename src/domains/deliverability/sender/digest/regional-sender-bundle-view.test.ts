import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSenderBundleView, toRegionalSenderBundleViews } from "./regional-sender-bundle-view.js";
import { newRegionalSenderBundle } from "./regional-sender-bundle.js";

test("RegionalSenderBundleView shows the status in capitals", () => {
  const item = newRegionalSenderBundle("code-936", "label-687");
  const view = toRegionalSenderBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSenderBundleViews([item, item]).length, 2, "views");
});
