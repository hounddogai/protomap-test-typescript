import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWaitMappingView, toLenientWaitMappingViews } from "./lenient-wait-mapping-view.js";
import { newLenientWaitMapping } from "./lenient-wait-mapping.js";

test("LenientWaitMappingView shows the status in capitals", () => {
  const item = newLenientWaitMapping("code-124", "name-729");
  const view = toLenientWaitMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWaitMappingViews([item, item]).length, 2, "views");
});
