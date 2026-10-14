import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortWindowView, toCohortWindowViews } from "./cohort-window-view.js";
import { newCohortWindow } from "./cohort-window.js";

test("CohortWindowView shows the status in capitals", () => {
  const item = newCohortWindow("code-121", "name-1");
  const view = toCohortWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortWindowViews([item, item]).length, 2, "views");
});
