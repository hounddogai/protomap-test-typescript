import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionRequestView, toSuppressionRequestViews } from "./suppression-request-view.js";
import { newSuppressionRequest } from "./suppression-request.js";

test("SuppressionRequestView shows the status in capitals", () => {
  const item = newSuppressionRequest("code-188", "label-440");
  const view = toSuppressionRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionRequestViews([item, item]).length, 2, "views");
});
