import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelMappingView, toModelMappingViews } from "./model-mapping-view.js";
import { newModelMapping } from "./model-mapping.js";

test("ModelMappingView shows the status in capitals", () => {
  const item = newModelMapping("code-280", "label-720");
  const view = toModelMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelMappingViews([item, item]).length, 2, "views");
});
