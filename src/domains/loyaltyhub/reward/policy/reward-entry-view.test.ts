import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardEntryView, toRewardEntryViews } from "./reward-entry-view.js";
import { newRewardEntry } from "./reward-entry.js";

test("RewardEntryView shows the status in capitals", () => {
  const item = newRewardEntry("code-136", "name-138");
  const view = toRewardEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardEntryViews([item, item]).length, 2, "views");
});
