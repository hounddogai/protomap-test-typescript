import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintBundleView, toComplaintBundleViews } from "./complaint-bundle-view.js";
import { newComplaintBundle } from "./complaint-bundle.js";

test("ComplaintBundleView shows the status in capitals", () => {
  const item = newComplaintBundle("code-634", "name-166");
  const view = toComplaintBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintBundleViews([item, item]).length, 2, "views");
});
