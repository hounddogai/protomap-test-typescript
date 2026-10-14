import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPathSlotView, toPrimaryPathSlotViews } from "./primary-path-slot-view.js";
import { newPrimaryPathSlot } from "./primary-path-slot.js";

test("PrimaryPathSlotView shows the status in capitals", () => {
  const item = newPrimaryPathSlot("code-731", "name-116");
  const view = toPrimaryPathSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPathSlotViews([item, item]).length, 2, "views");
});
