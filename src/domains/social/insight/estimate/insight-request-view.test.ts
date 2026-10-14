import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightRequestView, toInsightRequestViews } from "./insight-request-view.js";
import { newInsightRequest } from "./insight-request.js";

test("InsightRequestView shows the status in capitals", () => {
  const item = newInsightRequest("code-999", "title-744");
  const view = toInsightRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightRequestViews([item, item]).length, 2, "views");
});
