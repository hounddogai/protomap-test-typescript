import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredSenderMappingView, toTieredSenderMappingViews } from "./tiered-sender-mapping-view.js";
import { newTieredSenderMapping } from "./tiered-sender-mapping.js";

test("TieredSenderMappingView shows the status in capitals", () => {
  const item = newTieredSenderMapping("code-183", "name-524");
  const view = toTieredSenderMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSenderMappingViews([item, item]).length, 2, "views");
});
