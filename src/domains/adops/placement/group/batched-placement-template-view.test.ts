import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedPlacementTemplateView,
  toBatchedPlacementTemplateViews,
} from "./batched-placement-template-view.js";
import { newBatchedPlacementTemplate } from "./batched-placement-template.js";

test("BatchedPlacementTemplateView shows the status in capitals", () => {
  const item = newBatchedPlacementTemplate("code-837", "label-233");
  const view = toBatchedPlacementTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPlacementTemplateViews([item, item]).length, 2, "views");
});
