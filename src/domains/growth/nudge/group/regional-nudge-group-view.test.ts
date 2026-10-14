import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalNudgeGroupView, toRegionalNudgeGroupViews } from "./regional-nudge-group-view.js";
import { newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("RegionalNudgeGroupView shows the status in capitals", () => {
  const item = newRegionalNudgeGroup("code-601", "title-960");
  const view = toRegionalNudgeGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalNudgeGroupViews([item, item]).length, 2, "views");
});
