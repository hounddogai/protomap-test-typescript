import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientPacingTemplateView, toLenientPacingTemplateViews } from "./lenient-pacing-template-view.js";
import { newLenientPacingTemplate } from "./lenient-pacing-template.js";

test("LenientPacingTemplateView shows the status in capitals", () => {
  const item = newLenientPacingTemplate("code-628", "label-60");
  const view = toLenientPacingTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPacingTemplateViews([item, item]).length, 2, "views");
});
