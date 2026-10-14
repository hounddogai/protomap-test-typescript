import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultMentionMappingView, toDefaultMentionMappingViews } from "./default-mention-mapping-view.js";
import { newDefaultMentionMapping } from "./default-mention-mapping.js";

test("DefaultMentionMappingView shows the status in capitals", () => {
  const item = newDefaultMentionMapping("code-825", "label-606");
  const view = toDefaultMentionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMentionMappingViews([item, item]).length, 2, "views");
});
