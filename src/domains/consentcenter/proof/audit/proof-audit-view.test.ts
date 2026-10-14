import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofAuditView, toProofAuditViews } from "./proof-audit-view.js";
import { newProofAudit } from "./proof-audit.js";

test("ProofAuditView shows the status in capitals", () => {
  const item = newProofAudit("code-320", "title-239");
  const view = toProofAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofAuditViews([item, item]).length, 2, "views");
});
