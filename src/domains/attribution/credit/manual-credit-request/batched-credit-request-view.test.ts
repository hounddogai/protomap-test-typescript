import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCreditRequestView, toBatchedCreditRequestViews } from "./batched-credit-request-view.js";
import { newBatchedCreditRequest } from "./batched-credit-request.js";

test("BatchedCreditRequestView shows the status in capitals", () => {
  const item = newBatchedCreditRequest("code-848", "name-86");
  const view = toBatchedCreditRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCreditRequestViews([item, item]).length, 2, "views");
});
