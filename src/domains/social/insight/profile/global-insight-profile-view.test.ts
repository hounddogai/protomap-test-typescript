import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalInsightProfileView, toGlobalInsightProfileViews } from "./global-insight-profile-view.js";
import { newGlobalInsightProfile } from "./global-insight-profile.js";

test("GlobalInsightProfileView shows the status in capitals", () => {
  const item = newGlobalInsightProfile("code-32", "name-649");
  const view = toGlobalInsightProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalInsightProfileViews([item, item]).length, 2, "views");
});
