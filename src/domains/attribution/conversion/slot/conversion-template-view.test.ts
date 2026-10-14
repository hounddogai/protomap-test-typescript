import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionTemplateView, toConversionTemplateViews } from "./conversion-template-view.js";
import { newConversionTemplate } from "./conversion-template.js";

test("ConversionTemplateView shows the status in capitals", () => {
  const item = newConversionTemplate("code-324", "name-463");
  const view = toConversionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionTemplateViews([item, item]).length, 2, "views");
});
