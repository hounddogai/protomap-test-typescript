import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalDoubleOptInAuditView,
  toSeasonalDoubleOptInAuditViews,
} from "./seasonal-double-opt-in-audit-view.js";
import { newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

test("SeasonalDoubleOptInAuditView shows the status in capitals", () => {
  const item = newSeasonalDoubleOptInAudit("code-522", "label-528");
  const view = toSeasonalDoubleOptInAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDoubleOptInAuditViews([item, item]).length, 2, "views");
});
