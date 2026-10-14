import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictInsightRequestView, toStrictInsightRequestViews } from "./strict-insight-request-view.js";
import { newStrictInsightRequest } from "./strict-insight-request.js";

test("StrictInsightRequestView shows the status in capitals", () => {
  const item = newStrictInsightRequest("code-603", "title-234");
  const view = toStrictInsightRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictInsightRequestViews([item, item]).length, 2, "views");
});
