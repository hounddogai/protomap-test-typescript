import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyChallengeAuditView, toLegacyChallengeAuditViews } from "./legacy-challenge-audit-view.js";
import { newLegacyChallengeAudit } from "./legacy-challenge-audit.js";

test("LegacyChallengeAuditView shows the status in capitals", () => {
  const item = newLegacyChallengeAudit("code-339", "title-482");
  const view = toLegacyChallengeAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyChallengeAuditViews([item, item]).length, 2, "views");
});
