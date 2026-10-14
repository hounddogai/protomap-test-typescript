import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalActivationExceptionView,
  toSeasonalActivationExceptionViews,
} from "./seasonal-activation-exception-view.js";
import { newSeasonalActivationException } from "./seasonal-activation-exception.js";

test("SeasonalActivationExceptionView shows the status in capitals", () => {
  const item = newSeasonalActivationException("code-807", "title-337");
  const view = toSeasonalActivationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalActivationExceptionViews([item, item]).length, 2, "views");
});
