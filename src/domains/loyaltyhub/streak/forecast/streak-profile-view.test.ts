import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakProfileView, toStreakProfileViews } from "./streak-profile-view.js";
import { newStreakProfile } from "./streak-profile.js";

test("StreakProfileView shows the status in capitals", () => {
  const item = newStreakProfile("code-450", "label-921");
  const view = toStreakProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakProfileViews([item, item]).length, 2, "views");
});
