import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelOverrideView, toModelOverrideViews } from "./model-override-view.js";
import { newModelOverride } from "./model-override.js";

test("ModelOverrideView shows the status in capitals", () => {
  const item = newModelOverride("code-925", "title-99");
  const view = toModelOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelOverrideViews([item, item]).length, 2, "views");
});
