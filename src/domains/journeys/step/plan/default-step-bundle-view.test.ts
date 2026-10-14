import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultStepBundleView, toDefaultStepBundleViews } from "./default-step-bundle-view.js";
import { newDefaultStepBundle } from "./default-step-bundle.js";

test("DefaultStepBundleView shows the status in capitals", () => {
  const item = newDefaultStepBundle("code-84", "label-799");
  const view = toDefaultStepBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultStepBundleViews([item, item]).length, 2, "views");
});
