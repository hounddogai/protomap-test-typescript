import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathMappingView, toPathMappingViews } from "./path-mapping-view.js";
import { newPathMapping } from "./path-mapping.js";

test("PathMappingView shows the status in capitals", () => {
  const item = newPathMapping("code-135", "title-188");
  const view = toPathMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathMappingViews([item, item]).length, 2, "views");
});
