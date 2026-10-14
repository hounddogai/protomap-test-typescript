import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneyPolicyView, toRollingJourneyPolicyViews } from "./rolling-journey-policy-view.js";
import { newRollingJourneyPolicy } from "./rolling-journey-policy.js";

test("RollingJourneyPolicyView shows the status in capitals", () => {
  const item = newRollingJourneyPolicy("code-501", "label-366");
  const view = toRollingJourneyPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneyPolicyViews([item, item]).length, 2, "views");
});
