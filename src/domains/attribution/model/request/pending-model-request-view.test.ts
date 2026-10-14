import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingModelRequestView, toPendingModelRequestViews } from "./pending-model-request-view.js";
import { newPendingModelRequest } from "./pending-model-request.js";

test("PendingModelRequestView shows the status in capitals", () => {
  const item = newPendingModelRequest("code-917", "title-913");
  const view = toPendingModelRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingModelRequestViews([item, item]).length, 2, "views");
});
