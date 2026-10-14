import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictMentionOverrideView, toStrictMentionOverrideViews } from "./strict-mention-override-view.js";
import { newStrictMentionOverride } from "./strict-mention-override.js";

test("StrictMentionOverrideView shows the status in capitals", () => {
  const item = newStrictMentionOverride("code-961", "label-1");
  const view = toStrictMentionOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictMentionOverrideViews([item, item]).length, 2, "views");
});
