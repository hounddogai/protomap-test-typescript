import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepMappingView, toStepMappingViews } from "./step-mapping-view.js";
import { newStepMapping } from "./step-mapping.js";

test("StepMappingView shows the status in capitals", () => {
  const item = newStepMapping("code-985", "label-371");
  const view = toStepMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepMappingViews([item, item]).length, 2, "views");
});
