import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackFraudCheckExceptionView,
  toFallbackFraudCheckExceptionViews,
} from "./fallback-fraud-check-exception-view.js";
import { newFallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

test("FallbackFraudCheckExceptionView shows the status in capitals", () => {
  const item = newFallbackFraudCheckException("code-932", "label-727");
  const view = toFallbackFraudCheckExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFraudCheckExceptionViews([item, item]).length, 2, "views");
});
