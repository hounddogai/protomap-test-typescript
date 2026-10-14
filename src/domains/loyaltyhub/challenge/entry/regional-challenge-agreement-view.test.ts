import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalChallengeAgreementView,
  toRegionalChallengeAgreementViews,
} from "./regional-challenge-agreement-view.js";
import { newRegionalChallengeAgreement } from "./regional-challenge-agreement.js";

test("RegionalChallengeAgreementView shows the status in capitals", () => {
  const item = newRegionalChallengeAgreement("code-840", "name-568");
  const view = toRegionalChallengeAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalChallengeAgreementViews([item, item]).length, 2, "views");
});
