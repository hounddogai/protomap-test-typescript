import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCohortRequestView, toFallbackCohortRequestViews } from "./fallback-cohort-request-view.js";
import { newFallbackCohortRequest } from "./fallback-cohort-request.js";

test("FallbackCohortRequestView shows the status in capitals", () => {
  const item = newFallbackCohortRequest("code-63", "name-953");
  const view = toFallbackCohortRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCohortRequestViews([item, item]).length, 2, "views");
});
