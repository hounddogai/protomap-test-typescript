import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveComplaintGroupView, toAdaptiveComplaintGroupViews } from "./adaptive-complaint-group-view.js";
import { newAdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

test("AdaptiveComplaintGroupView shows the status in capitals", () => {
  const item = newAdaptiveComplaintGroup("code-142", "name-831");
  const view = toAdaptiveComplaintGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveComplaintGroupViews([item, item]).length, 2, "views");
});
