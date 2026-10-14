import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientJourneyPolicyView, toLenientJourneyPolicyViews } from "./lenient-journey-policy-view.js";
import { newLenientJourneyPolicy } from "./lenient-journey-policy.js";

test("LenientJourneyPolicyView shows the status in capitals", () => {
  const item = newLenientJourneyPolicy("code-357", "label-701");
  const view = toLenientJourneyPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientJourneyPolicyViews([item, item]).length, 2, "views");
});
