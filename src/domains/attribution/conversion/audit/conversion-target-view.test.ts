import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionTargetView, toConversionTargetViews } from "./conversion-target-view.js";
import { newConversionTarget } from "./conversion-target.js";

test("ConversionTargetView shows the status in capitals", () => {
  const item = newConversionTarget("code-471", "name-285");
  const view = toConversionTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionTargetViews([item, item]).length, 2, "views");
});
