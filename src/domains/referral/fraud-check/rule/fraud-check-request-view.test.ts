import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckRequestView, toFraudCheckRequestViews } from "./fraud-check-request-view.js";
import { newFraudCheckRequest } from "./fraud-check-request.js";

test("FraudCheckRequestView shows the status in capitals", () => {
  const item = newFraudCheckRequest("code-873", "label-551");
  const view = toFraudCheckRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckRequestViews([item, item]).length, 2, "views");
});
