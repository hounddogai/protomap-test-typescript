import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryEnrollmentEstimateView,
  toPrimaryEnrollmentEstimateViews,
} from "./primary-enrollment-estimate-view.js";
import { newPrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

test("PrimaryEnrollmentEstimateView shows the status in capitals", () => {
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  const view = toPrimaryEnrollmentEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryEnrollmentEstimateViews([item, item]).length, 2, "views");
});
