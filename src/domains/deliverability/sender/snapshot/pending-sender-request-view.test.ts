import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSenderRequestView, toPendingSenderRequestViews } from "./pending-sender-request-view.js";
import { newPendingSenderRequest } from "./pending-sender-request.js";

test("PendingSenderRequestView shows the status in capitals", () => {
  const item = newPendingSenderRequest("code-708", "title-389");
  const view = toPendingSenderRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSenderRequestViews([item, item]).length, 2, "views");
});
