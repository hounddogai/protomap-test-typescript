import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowOverrideView, toWindowOverrideViews } from "./window-override-view.js";
import { newWindowOverride } from "./window-override.js";

test("WindowOverrideView shows the status in capitals", () => {
  const item = newWindowOverride("code-131", "title-390");
  const view = toWindowOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowOverrideViews([item, item]).length, 2, "views");
});
