import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictCreativeAllocationView,
  toStrictCreativeAllocationViews,
} from "./strict-creative-allocation-view.js";
import { newStrictCreativeAllocation } from "./strict-creative-allocation.js";

test("StrictCreativeAllocationView shows the status in capitals", () => {
  const item = newStrictCreativeAllocation("code-639", "title-767");
  const view = toStrictCreativeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreativeAllocationViews([item, item]).length, 2, "views");
});
