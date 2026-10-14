import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSenderBundleView, toFallbackSenderBundleViews } from "./fallback-sender-bundle-view.js";
import { newFallbackSenderBundle } from "./fallback-sender-bundle.js";

test("FallbackSenderBundleView shows the status in capitals", () => {
  const item = newFallbackSenderBundle("code-57", "title-340");
  const view = toFallbackSenderBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSenderBundleViews([item, item]).length, 2, "views");
});
