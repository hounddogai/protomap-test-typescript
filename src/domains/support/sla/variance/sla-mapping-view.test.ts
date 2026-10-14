import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaMappingView, toSlaMappingViews } from "./sla-mapping-view.js";
import { newSlaMapping } from "./sla-mapping.js";

test("SlaMappingView shows the status in capitals", () => {
  const item = newSlaMapping("code-3", "name-359");
  const view = toSlaMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaMappingViews([item, item]).length, 2, "views");
});
