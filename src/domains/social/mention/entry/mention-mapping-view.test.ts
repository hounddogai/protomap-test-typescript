import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionMappingView, toMentionMappingViews } from "./mention-mapping-view.js";
import { newMentionMapping } from "./mention-mapping.js";

test("MentionMappingView shows the status in capitals", () => {
  const item = newMentionMapping("code-891", "name-893");
  const view = toMentionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionMappingViews([item, item]).length, 2, "views");
});
