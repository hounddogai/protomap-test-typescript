import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionMappingView, toDeflectionMappingViews } from "./deflection-mapping-view.js";
import { newDeflectionMapping } from "./deflection-mapping.js";

test("DeflectionMappingView shows the status in capitals", () => {
  const item = newDeflectionMapping("code-434", "title-90");
  const view = toDeflectionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionMappingViews([item, item]).length, 2, "views");
});
