import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeOverrideView, toCreativeOverrideViews } from "./creative-override-view.js";
import { newCreativeOverride } from "./creative-override.js";

test("CreativeOverrideView shows the status in capitals", () => {
  const item = newCreativeOverride("code-948", "label-653");
  const view = toCreativeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeOverrideViews([item, item]).length, 2, "views");
});
