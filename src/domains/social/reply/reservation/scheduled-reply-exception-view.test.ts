import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledReplyExceptionView, toScheduledReplyExceptionViews } from "./scheduled-reply-exception-view.js";
import { newScheduledReplyException } from "./scheduled-reply-exception.js";

test("ScheduledReplyExceptionView shows the status in capitals", () => {
  const item = newScheduledReplyException("code-404", "name-901");
  const view = toScheduledReplyExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledReplyExceptionViews([item, item]).length, 2, "views");
});
