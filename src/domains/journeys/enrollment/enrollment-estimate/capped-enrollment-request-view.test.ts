import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedEnrollmentRequestView, toCappedEnrollmentRequestViews } from "./capped-enrollment-request-view.js";
import { newCappedEnrollmentRequest } from "./capped-enrollment-request.js";

test("CappedEnrollmentRequestView shows the status in capitals", () => {
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  const view = toCappedEnrollmentRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedEnrollmentRequestViews([item, item]).length, 2, "views");
});
