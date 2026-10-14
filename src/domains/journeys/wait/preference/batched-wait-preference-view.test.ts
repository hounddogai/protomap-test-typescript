import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWaitPreferenceView, toBatchedWaitPreferenceViews } from "./batched-wait-preference-view.js";
import { newBatchedWaitPreference } from "./batched-wait-preference.js";

test("BatchedWaitPreferenceView shows the status in capitals", () => {
  const item = newBatchedWaitPreference("code-481", "title-657");
  const view = toBatchedWaitPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWaitPreferenceViews([item, item]).length, 2, "views");
});
