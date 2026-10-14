import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSenderMappingView, toRegionalSenderMappingViews } from "./regional-sender-mapping-view.js";
import { newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("RegionalSenderMappingView shows the status in capitals", () => {
  const item = newRegionalSenderMapping("code-569", "label-347");
  const view = toRegionalSenderMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSenderMappingViews([item, item]).length, 2, "views");
});
