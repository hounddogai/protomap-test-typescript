import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckGroupView, toFraudCheckGroupViews } from "./fraud-check-group-view.js";
import { newFraudCheckGroup } from "./fraud-check-group.js";

test("FraudCheckGroupView shows the status in capitals", () => {
  const item = newFraudCheckGroup("code-232", "title-242");
  const view = toFraudCheckGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckGroupViews([item, item]).length, 2, "views");
});
