import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakRequestView, toStreakRequestViews } from "./streak-request-view.js";
import { newStreakRequest } from "./streak-request.js";

test("StreakRequestView shows the status in capitals", () => {
  const item = newStreakRequest("code-871", "title-518");
  const view = toStreakRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakRequestViews([item, item]).length, 2, "views");
});
