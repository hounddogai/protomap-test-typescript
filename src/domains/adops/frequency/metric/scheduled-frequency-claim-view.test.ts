import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledFrequencyClaimView, toScheduledFrequencyClaimViews } from "./scheduled-frequency-claim-view.js";
import { newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("ScheduledFrequencyClaimView shows the status in capitals", () => {
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  const view = toScheduledFrequencyClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFrequencyClaimViews([item, item]).length, 2, "views");
});
