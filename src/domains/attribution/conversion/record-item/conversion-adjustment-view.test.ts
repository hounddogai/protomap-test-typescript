import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionAdjustmentView, toConversionAdjustmentViews } from "./conversion-adjustment-view.js";
import { newConversionAdjustment } from "./conversion-adjustment.js";

test("ConversionAdjustmentView shows the status in capitals", () => {
  const item = newConversionAdjustment("code-861", "title-343");
  const view = toConversionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionAdjustmentViews([item, item]).length, 2, "views");
});
