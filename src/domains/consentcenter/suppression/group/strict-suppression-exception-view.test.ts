import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictSuppressionExceptionView,
  toStrictSuppressionExceptionViews,
} from "./strict-suppression-exception-view.js";
import { newStrictSuppressionException } from "./strict-suppression-exception.js";

test("StrictSuppressionExceptionView shows the status in capitals", () => {
  const item = newStrictSuppressionException("code-616", "name-169");
  const view = toStrictSuppressionExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictSuppressionExceptionViews([item, item]).length, 2, "views");
});
