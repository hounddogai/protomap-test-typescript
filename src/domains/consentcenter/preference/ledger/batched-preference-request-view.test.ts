import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedPreferenceRequestView,
  toBatchedPreferenceRequestViews,
} from "./batched-preference-request-view.js";
import { newBatchedPreferenceRequest } from "./batched-preference-request.js";

test("BatchedPreferenceRequestView shows the status in capitals", () => {
  const item = newBatchedPreferenceRequest("code-710", "name-740");
  const view = toBatchedPreferenceRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPreferenceRequestViews([item, item]).length, 2, "views");
});
