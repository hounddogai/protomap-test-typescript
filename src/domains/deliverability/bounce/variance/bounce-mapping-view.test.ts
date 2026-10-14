import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceMappingView, toBounceMappingViews } from "./bounce-mapping-view.js";
import { newBounceMapping } from "./bounce-mapping.js";

test("BounceMappingView shows the status in capitals", () => {
  const item = newBounceMapping("code-377", "name-122");
  const view = toBounceMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceMappingViews([item, item]).length, 2, "views");
});
