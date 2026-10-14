import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveModelTemplateView, toAdaptiveModelTemplateViews } from "./adaptive-model-template-view.js";
import { newAdaptiveModelTemplate } from "./adaptive-model-template.js";

test("AdaptiveModelTemplateView shows the status in capitals", () => {
  const item = newAdaptiveModelTemplate("code-811", "label-967");
  const view = toAdaptiveModelTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveModelTemplateViews([item, item]).length, 2, "views");
});
