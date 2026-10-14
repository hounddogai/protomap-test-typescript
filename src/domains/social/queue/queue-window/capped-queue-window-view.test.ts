import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedQueueWindowView, toCappedQueueWindowViews } from "./capped-queue-window-view.js";
import { newCappedQueueWindow } from "./capped-queue-window.js";

test("CappedQueueWindowView shows the status in capitals", () => {
  const item = newCappedQueueWindow("code-176", "name-436");
  const view = toCappedQueueWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedQueueWindowViews([item, item]).length, 2, "views");
});
