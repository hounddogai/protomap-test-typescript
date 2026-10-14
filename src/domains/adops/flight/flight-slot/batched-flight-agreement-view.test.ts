import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFlightAgreementView, toBatchedFlightAgreementViews } from "./batched-flight-agreement-view.js";
import { newBatchedFlightAgreement } from "./batched-flight-agreement.js";

test("BatchedFlightAgreementView shows the status in capitals", () => {
  const item = newBatchedFlightAgreement("code-665", "name-831");
  const view = toBatchedFlightAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFlightAgreementViews([item, item]).length, 2, "views");
});
