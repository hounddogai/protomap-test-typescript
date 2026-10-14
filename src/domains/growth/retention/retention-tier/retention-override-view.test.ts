import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionOverrideView, toRetentionOverrideViews } from "./retention-override-view.js";
import { newRetentionOverride } from "./retention-override.js";

test("RetentionOverrideView shows the status in capitals", () => {
  const item = newRetentionOverride("code-905", "title-43");
  const view = toRetentionOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionOverrideViews([item, item]).length, 2, "views");
});
