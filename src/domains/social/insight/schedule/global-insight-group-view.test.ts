import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalInsightGroupView, toGlobalInsightGroupViews } from "./global-insight-group-view.js";
import { newGlobalInsightGroup } from "./global-insight-group.js";

test("GlobalInsightGroupView shows the status in capitals", () => {
  const item = newGlobalInsightGroup("code-514", "label-229");
  const view = toGlobalInsightGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalInsightGroupViews([item, item]).length, 2, "views");
});
