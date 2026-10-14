import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepRequestView, toStepRequestViews } from "./step-request-view.js";
import { newStepRequest } from "./step-request.js";

test("StepRequestView shows the status in capitals", () => {
  const item = newStepRequest("code-270", "label-250");
  const view = toStepRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepRequestViews([item, item]).length, 2, "views");
});
