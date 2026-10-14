import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightQuotaView, toInsightQuotaViews } from "./insight-quota-view.js";
import { newInsightQuota } from "./insight-quota.js";

test("InsightQuotaView shows the status in capitals", () => {
  const item = newInsightQuota("code-996", "title-534");
  const view = toInsightQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightQuotaViews([item, item]).length, 2, "views");
});
