import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderBundleView, toSenderBundleViews } from "./sender-bundle-view.js";
import { newSenderBundle } from "./sender-bundle.js";

test("SenderBundleView shows the status in capitals", () => {
  const item = newSenderBundle("code-213", "label-207");
  const view = toSenderBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderBundleViews([item, item]).length, 2, "views");
});
