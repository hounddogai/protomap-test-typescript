import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationExceptionView, toReputationExceptionViews } from "./reputation-exception-view.js";
import { newReputationException } from "./reputation-exception.js";

test("ReputationExceptionView shows the status in capitals", () => {
  const item = newReputationException("code-429", "label-754");
  const view = toReputationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationExceptionViews([item, item]).length, 2, "views");
});
