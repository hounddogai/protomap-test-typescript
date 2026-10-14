import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyComplaintVarianceView, toLegacyComplaintVarianceViews } from "./legacy-complaint-variance-view.js";
import { newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

test("LegacyComplaintVarianceView shows the status in capitals", () => {
  const item = newLegacyComplaintVariance("code-603", "title-178");
  const view = toLegacyComplaintVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyComplaintVarianceViews([item, item]).length, 2, "views");
});
