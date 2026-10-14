import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientSuppressionExceptionView,
  toLenientSuppressionExceptionViews,
} from "./lenient-suppression-exception-view.js";
import { newLenientSuppressionException } from "./lenient-suppression-exception.js";

test("LenientSuppressionExceptionView shows the status in capitals", () => {
  const item = newLenientSuppressionException("code-118", "title-329");
  const view = toLenientSuppressionExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSuppressionExceptionViews([item, item]).length, 2, "views");
});
