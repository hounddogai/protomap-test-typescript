import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedModelGroupView, toCappedModelGroupViews } from "./capped-model-group-view.js";
import { newCappedModelGroup } from "./capped-model-group.js";

test("CappedModelGroupView shows the status in capitals", () => {
  const item = newCappedModelGroup("code-185", "label-323");
  const view = toCappedModelGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedModelGroupViews([item, item]).length, 2, "views");
});
