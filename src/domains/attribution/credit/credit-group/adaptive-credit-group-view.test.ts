import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCreditGroupView, toAdaptiveCreditGroupViews } from "./adaptive-credit-group-view.js";
import { newAdaptiveCreditGroup } from "./adaptive-credit-group.js";

test("AdaptiveCreditGroupView shows the status in capitals", () => {
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  const view = toAdaptiveCreditGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreditGroupViews([item, item]).length, 2, "views");
});
