import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeMappingView, toBadgeMappingViews } from "./badge-mapping-view.js";
import { newBadgeMapping } from "./badge-mapping.js";

test("BadgeMappingView shows the status in capitals", () => {
  const item = newBadgeMapping("code-702", "label-79");
  const view = toBadgeMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeMappingViews([item, item]).length, 2, "views");
});
