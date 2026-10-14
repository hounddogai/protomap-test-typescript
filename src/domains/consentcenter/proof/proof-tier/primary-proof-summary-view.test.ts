import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryProofSummaryView, toPrimaryProofSummaryViews } from "./primary-proof-summary-view.js";
import { newPrimaryProofSummary } from "./primary-proof-summary.js";

test("PrimaryProofSummaryView shows the status in capitals", () => {
  const item = newPrimaryProofSummary("code-463", "name-257");
  const view = toPrimaryProofSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryProofSummaryViews([item, item]).length, 2, "views");
});
