import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionVarianceView, toMentionVarianceViews } from "./mention-variance-view.js";
import { newMentionVariance } from "./mention-variance.js";

test("MentionVarianceView shows the status in capitals", () => {
  const item = newMentionVariance("code-72", "label-42");
  const view = toMentionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionVarianceViews([item, item]).length, 2, "views");
});
