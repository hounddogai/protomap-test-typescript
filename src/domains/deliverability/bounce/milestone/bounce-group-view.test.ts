import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceGroupView, toBounceGroupViews } from "./bounce-group-view.js";
import { newBounceGroup } from "./bounce-group.js";

test("BounceGroupView shows the status in capitals", () => {
  const item = newBounceGroup("code-354", "label-396");
  const view = toBounceGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceGroupViews([item, item]).length, 2, "views");
});
