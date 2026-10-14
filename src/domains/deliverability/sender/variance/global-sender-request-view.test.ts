import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalSenderRequestView, toGlobalSenderRequestViews } from "./global-sender-request-view.js";
import { newGlobalSenderRequest } from "./global-sender-request.js";

test("GlobalSenderRequestView shows the status in capitals", () => {
  const item = newGlobalSenderRequest("code-212", "name-643");
  const view = toGlobalSenderRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSenderRequestViews([item, item]).length, 2, "views");
});
