import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderMappingView, toSenderMappingViews } from "./sender-mapping-view.js";
import { newSenderMapping } from "./sender-mapping.js";

test("SenderMappingView shows the status in capitals", () => {
  const item = newSenderMapping("code-49", "title-939");
  const view = toSenderMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderMappingViews([item, item]).length, 2, "views");
});
