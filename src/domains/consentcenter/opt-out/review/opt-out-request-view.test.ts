import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutRequestView, toOptOutRequestViews } from "./opt-out-request-view.js";
import { newOptOutRequest } from "./opt-out-request.js";

test("OptOutRequestView shows the status in capitals", () => {
  const item = newOptOutRequest("code-724", "title-428");
  const view = toOptOutRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutRequestViews([item, item]).length, 2, "views");
});
