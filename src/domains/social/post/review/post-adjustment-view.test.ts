import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostAdjustmentView, toPostAdjustmentViews } from "./post-adjustment-view.js";
import { newPostAdjustment } from "./post-adjustment.js";

test("PostAdjustmentView shows the status in capitals", () => {
  const item = newPostAdjustment("code-943", "title-604");
  const view = toPostAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostAdjustmentViews([item, item]).length, 2, "views");
});
