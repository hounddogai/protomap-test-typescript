import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveQueueTemplateView, toAdaptiveQueueTemplateViews } from "./adaptive-queue-template-view.js";
import { newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

test("AdaptiveQueueTemplateView shows the status in capitals", () => {
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  const view = toAdaptiveQueueTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveQueueTemplateViews([item, item]).length, 2, "views");
});
