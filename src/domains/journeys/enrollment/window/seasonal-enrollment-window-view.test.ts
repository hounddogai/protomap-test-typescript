import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalEnrollmentWindowView,
  toSeasonalEnrollmentWindowViews,
} from "./seasonal-enrollment-window-view.js";
import { newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

test("SeasonalEnrollmentWindowView shows the status in capitals", () => {
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  const view = toSeasonalEnrollmentWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalEnrollmentWindowViews([item, item]).length, 2, "views");
});
