import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCsatRequestView, toAdaptiveCsatRequestViews } from "./adaptive-csat-request-view.js";
import { newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

test("AdaptiveCsatRequestView shows the status in capitals", () => {
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  const view = toAdaptiveCsatRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCsatRequestViews([item, item]).length, 2, "views");
});
