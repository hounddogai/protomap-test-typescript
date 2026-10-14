import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveDeflectionTemplateView,
  toAdaptiveDeflectionTemplateViews,
} from "./adaptive-deflection-template-view.js";
import { newAdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

test("AdaptiveDeflectionTemplateView shows the status in capitals", () => {
  const item = newAdaptiveDeflectionTemplate("code-902", "title-794");
  const view = toAdaptiveDeflectionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDeflectionTemplateViews([item, item]).length, 2, "views");
});
