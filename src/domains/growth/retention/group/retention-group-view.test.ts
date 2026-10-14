import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionGroupView, toRetentionGroupViews } from "./retention-group-view.js";
import { newRetentionGroup } from "./retention-group.js";

test("RetentionGroupView shows the status in capitals", () => {
  const item = newRetentionGroup("code-429", "name-186");
  const view = toRetentionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionGroupViews([item, item]).length, 2, "views");
});
