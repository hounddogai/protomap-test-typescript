import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueProfileView, toQueueProfileViews } from "./queue-profile-view.js";
import { newQueueProfile } from "./queue-profile.js";

test("QueueProfileView shows the status in capitals", () => {
  const item = newQueueProfile("code-855", "title-526");
  const view = toQueueProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueProfileViews([item, item]).length, 2, "views");
});
