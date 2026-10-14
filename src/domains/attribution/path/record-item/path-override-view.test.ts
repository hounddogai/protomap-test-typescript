import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathOverrideView, toPathOverrideViews } from "./path-override-view.js";
import { newPathOverride } from "./path-override.js";

test("PathOverrideView shows the status in capitals", () => {
  const item = newPathOverride("code-139", "title-496");
  const view = toPathOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathOverrideViews([item, item]).length, 2, "views");
});
