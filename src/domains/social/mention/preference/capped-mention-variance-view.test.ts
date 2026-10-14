import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedMentionVarianceView, toCappedMentionVarianceViews } from "./capped-mention-variance-view.js";
import { newCappedMentionVariance } from "./capped-mention-variance.js";

test("CappedMentionVarianceView shows the status in capitals", () => {
  const item = newCappedMentionVariance("code-731", "name-4");
  const view = toCappedMentionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedMentionVarianceViews([item, item]).length, 2, "views");
});
