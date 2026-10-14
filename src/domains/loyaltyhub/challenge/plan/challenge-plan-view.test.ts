import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengePlanView, toChallengePlanViews } from "./challenge-plan-view.js";
import { newChallengePlan } from "./challenge-plan.js";

test("ChallengePlanView shows the status in capitals", () => {
  const item = newChallengePlan("code-523", "name-636");
  const view = toChallengePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengePlanViews([item, item]).length, 2, "views");
});
