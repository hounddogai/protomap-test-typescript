import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementExceptionView, toPlacementExceptionViews } from "./placement-exception-view.js";
import { newPlacementException } from "./placement-exception.js";

test("PlacementExceptionView shows the status in capitals", () => {
  const item = newPlacementException("code-562", "label-663");
  const view = toPlacementExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementExceptionViews([item, item]).length, 2, "views");
});
