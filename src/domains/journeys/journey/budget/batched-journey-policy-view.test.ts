import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedJourneyPolicyView, toBatchedJourneyPolicyViews } from "./batched-journey-policy-view.js";
import { newBatchedJourneyPolicy } from "./batched-journey-policy.js";

test("BatchedJourneyPolicyView shows the status in capitals", () => {
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  const view = toBatchedJourneyPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedJourneyPolicyViews([item, item]).length, 2, "views");
});
