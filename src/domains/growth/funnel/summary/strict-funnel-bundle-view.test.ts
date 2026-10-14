import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFunnelBundleView, toStrictFunnelBundleViews } from "./strict-funnel-bundle-view.js";
import { newStrictFunnelBundle } from "./strict-funnel-bundle.js";

test("StrictFunnelBundleView shows the status in capitals", () => {
  const item = newStrictFunnelBundle("code-41", "title-577");
  const view = toStrictFunnelBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFunnelBundleViews([item, item]).length, 2, "views");
});
