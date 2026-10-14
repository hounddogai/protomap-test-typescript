import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultRedemptionExceptionView,
  toDefaultRedemptionExceptionViews,
} from "./default-redemption-exception-view.js";
import { newDefaultRedemptionException } from "./default-redemption-exception.js";

test("DefaultRedemptionExceptionView shows the status in capitals", () => {
  const item = newDefaultRedemptionException("code-376", "label-188");
  const view = toDefaultRedemptionExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRedemptionExceptionViews([item, item]).length, 2, "views");
});
