import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceRequestView, toBounceRequestViews } from "./bounce-request-view.js";
import { newBounceRequest } from "./bounce-request.js";

test("BounceRequestView shows the status in capitals", () => {
  const item = newBounceRequest("code-942", "title-167");
  const view = toBounceRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceRequestViews([item, item]).length, 2, "views");
});
