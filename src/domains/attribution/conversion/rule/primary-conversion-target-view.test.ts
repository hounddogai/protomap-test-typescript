import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryConversionTargetView, toPrimaryConversionTargetViews } from "./primary-conversion-target-view.js";
import { newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("PrimaryConversionTargetView shows the status in capitals", () => {
  const item = newPrimaryConversionTarget("code-18", "title-358");
  const view = toPrimaryConversionTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryConversionTargetViews([item, item]).length, 2, "views");
});
