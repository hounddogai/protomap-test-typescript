import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedSenderExceptionView, toWeightedSenderExceptionViews } from "./weighted-sender-exception-view.js";
import { newWeightedSenderException } from "./weighted-sender-exception.js";

test("WeightedSenderExceptionView shows the status in capitals", () => {
  const item = newWeightedSenderException("code-520", "label-358");
  const view = toWeightedSenderExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedSenderExceptionViews([item, item]).length, 2, "views");
});
