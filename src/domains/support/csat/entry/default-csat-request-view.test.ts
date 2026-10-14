import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultCsatRequestView, toDefaultCsatRequestViews } from "./default-csat-request-view.js";
import { newDefaultCsatRequest } from "./default-csat-request.js";

test("DefaultCsatRequestView shows the status in capitals", () => {
  const item = newDefaultCsatRequest("code-577", "title-69");
  const view = toDefaultCsatRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCsatRequestViews([item, item]).length, 2, "views");
});
