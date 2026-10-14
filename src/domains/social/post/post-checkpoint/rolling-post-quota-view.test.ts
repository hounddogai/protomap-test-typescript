import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPostQuotaView, toRollingPostQuotaViews } from "./rolling-post-quota-view.js";
import { newRollingPostQuota } from "./rolling-post-quota.js";

test("RollingPostQuotaView shows the status in capitals", () => {
  const item = newRollingPostQuota("code-590", "label-770");
  const view = toRollingPostQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPostQuotaViews([item, item]).length, 2, "views");
});
