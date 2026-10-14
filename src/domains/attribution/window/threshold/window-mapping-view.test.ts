import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowMappingView, toWindowMappingViews } from "./window-mapping-view.js";
import { newWindowMapping } from "./window-mapping.js";

test("WindowMappingView shows the status in capitals", () => {
  const item = newWindowMapping("code-378", "name-100");
  const view = toWindowMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowMappingViews([item, item]).length, 2, "views");
});
