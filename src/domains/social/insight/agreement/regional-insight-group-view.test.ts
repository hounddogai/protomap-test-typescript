import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalInsightGroupView, toRegionalInsightGroupViews } from "./regional-insight-group-view.js";
import { newRegionalInsightGroup } from "./regional-insight-group.js";

test("RegionalInsightGroupView shows the status in capitals", () => {
  const item = newRegionalInsightGroup("code-779", "label-134");
  const view = toRegionalInsightGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalInsightGroupViews([item, item]).length, 2, "views");
});
