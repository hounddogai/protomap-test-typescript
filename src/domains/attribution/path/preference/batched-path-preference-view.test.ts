import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPathPreferenceView, toBatchedPathPreferenceViews } from "./batched-path-preference-view.js";
import { newBatchedPathPreference } from "./batched-path-preference.js";

test("BatchedPathPreferenceView shows the status in capitals", () => {
  const item = newBatchedPathPreference("code-96", "title-70");
  const view = toBatchedPathPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPathPreferenceViews([item, item]).length, 2, "views");
});
