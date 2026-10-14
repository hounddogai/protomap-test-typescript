import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceRequestView, toPreferenceRequestViews } from "./preference-request-view.js";
import { newPreferenceRequest } from "./preference-request.js";

test("PreferenceRequestView shows the status in capitals", () => {
  const item = newPreferenceRequest("code-346", "name-945");
  const view = toPreferenceRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceRequestViews([item, item]).length, 2, "views");
});
