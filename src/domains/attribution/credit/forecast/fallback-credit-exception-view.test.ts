import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCreditExceptionView, toFallbackCreditExceptionViews } from "./fallback-credit-exception-view.js";
import { newFallbackCreditException } from "./fallback-credit-exception.js";

test("FallbackCreditExceptionView shows the status in capitals", () => {
  const item = newFallbackCreditException("code-289", "label-584");
  const view = toFallbackCreditExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreditExceptionViews([item, item]).length, 2, "views");
});
