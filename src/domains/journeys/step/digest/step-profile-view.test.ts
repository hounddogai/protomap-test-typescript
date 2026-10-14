import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepProfileView, toStepProfileViews } from "./step-profile-view.js";
import { newStepProfile } from "./step-profile.js";

test("StepProfileView shows the status in capitals", () => {
  const item = newStepProfile("code-565", "label-927");
  const view = toStepProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepProfileViews([item, item]).length, 2, "views");
});
