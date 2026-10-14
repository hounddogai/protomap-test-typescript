import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostBaselineView, toPostBaselineViews } from "./post-baseline-view.js";
import { newPostBaseline } from "./post-baseline.js";

test("PostBaselineView shows the status in capitals", () => {
  const item = newPostBaseline("code-459", "title-154");
  const view = toPostBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostBaselineViews([item, item]).length, 2, "views");
});
