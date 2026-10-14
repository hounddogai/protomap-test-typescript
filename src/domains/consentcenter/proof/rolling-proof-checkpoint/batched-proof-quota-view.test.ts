import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedProofQuotaView, toBatchedProofQuotaViews } from "./batched-proof-quota-view.js";
import { newBatchedProofQuota } from "./batched-proof-quota.js";

test("BatchedProofQuotaView shows the status in capitals", () => {
  const item = newBatchedProofQuota("code-726", "label-349");
  const view = toBatchedProofQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedProofQuotaViews([item, item]).length, 2, "views");
});
