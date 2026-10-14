import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPathRequestView, toRegionalPathRequestViews } from "./regional-path-request-view.js";
import { newRegionalPathRequest } from "./regional-path-request.js";

test("RegionalPathRequestView shows the status in capitals", () => {
  const item = newRegionalPathRequest("code-190", "name-498");
  const view = toRegionalPathRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPathRequestViews([item, item]).length, 2, "views");
});
