import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckExceptionView, toFraudCheckExceptionViews } from "./fraud-check-exception-view.js";
import { newFraudCheckException } from "./fraud-check-exception.js";

test("FraudCheckExceptionView shows the status in capitals", () => {
  const item = newFraudCheckException("code-324", "title-866");
  const view = toFraudCheckExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckExceptionViews([item, item]).length, 2, "views");
});
