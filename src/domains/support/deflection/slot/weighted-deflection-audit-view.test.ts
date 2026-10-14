import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedDeflectionAuditView, toWeightedDeflectionAuditViews } from "./weighted-deflection-audit-view.js";
import { newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("WeightedDeflectionAuditView shows the status in capitals", () => {
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  const view = toWeightedDeflectionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDeflectionAuditViews([item, item]).length, 2, "views");
});
