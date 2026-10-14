import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostOverrideView, toPostOverrideViews } from "./post-override-view.js";
import { newPostOverride } from "./post-override.js";

test("PostOverrideView shows the status in capitals", () => {
  const item = newPostOverride("code-844", "title-920");
  const view = toPostOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostOverrideViews([item, item]).length, 2, "views");
});
