import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedMentionAuditView, toWeightedMentionAuditViews } from "./weighted-mention-audit-view.js";
import { newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("WeightedMentionAuditView shows the status in capitals", () => {
  const item = newWeightedMentionAudit("code-232", "label-839");
  const view = toWeightedMentionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedMentionAuditViews([item, item]).length, 2, "views");
});
