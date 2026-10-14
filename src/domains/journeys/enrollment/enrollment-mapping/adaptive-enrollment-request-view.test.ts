import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveEnrollmentRequestView,
  toAdaptiveEnrollmentRequestViews,
} from "./adaptive-enrollment-request-view.js";
import { newAdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

test("AdaptiveEnrollmentRequestView shows the status in capitals", () => {
  const item = newAdaptiveEnrollmentRequest("code-402", "name-373");
  const view = toAdaptiveEnrollmentRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveEnrollmentRequestViews([item, item]).length, 2, "views");
});
