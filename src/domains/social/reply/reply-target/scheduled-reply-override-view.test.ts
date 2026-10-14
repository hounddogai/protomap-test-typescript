import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledReplyOverrideView, toScheduledReplyOverrideViews } from "./scheduled-reply-override-view.js";
import { newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("ScheduledReplyOverrideView shows the status in capitals", () => {
  const item = newScheduledReplyOverride("code-852", "label-626");
  const view = toScheduledReplyOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledReplyOverrideViews([item, item]).length, 2, "views");
});
