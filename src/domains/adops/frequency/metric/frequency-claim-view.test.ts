import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyClaimView, toFrequencyClaimViews } from "./frequency-claim-view.js";
import { newFrequencyClaim } from "./frequency-claim.js";

test("FrequencyClaimView shows the status in capitals", () => {
  const item = newFrequencyClaim("code-216", "title-886");
  const view = toFrequencyClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyClaimViews([item, item]).length, 2, "views");
});
