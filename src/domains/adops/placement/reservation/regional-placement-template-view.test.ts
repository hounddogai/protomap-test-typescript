import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalPlacementTemplateView,
  toRegionalPlacementTemplateViews,
} from "./regional-placement-template-view.js";
import { newRegionalPlacementTemplate } from "./regional-placement-template.js";

test("RegionalPlacementTemplateView shows the status in capitals", () => {
  const item = newRegionalPlacementTemplate("code-495", "title-797");
  const view = toRegionalPlacementTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPlacementTemplateViews([item, item]).length, 2, "views");
});
