import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointTemplateView, toTouchpointTemplateViews } from "./touchpoint-template-view.js";
import { newTouchpointTemplate } from "./touchpoint-template.js";

test("TouchpointTemplateView shows the status in capitals", () => {
  const item = newTouchpointTemplate("code-532", "name-582");
  const view = toTouchpointTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointTemplateViews([item, item]).length, 2, "views");
});
