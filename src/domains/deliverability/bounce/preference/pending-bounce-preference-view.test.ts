import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingBouncePreferenceView, toPendingBouncePreferenceViews } from "./pending-bounce-preference-view.js";
import { newPendingBouncePreference } from "./pending-bounce-preference.js";

test("PendingBouncePreferenceView shows the status in capitals", () => {
  const item = newPendingBouncePreference("code-378", "label-905");
  const view = toPendingBouncePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingBouncePreferenceViews([item, item]).length, 2, "views");
});
