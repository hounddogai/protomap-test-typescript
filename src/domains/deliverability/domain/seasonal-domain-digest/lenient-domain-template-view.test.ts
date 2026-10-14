import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientDomainTemplateView, toLenientDomainTemplateViews } from "./lenient-domain-template-view.js";
import { newLenientDomainTemplate } from "./lenient-domain-template.js";

test("LenientDomainTemplateView shows the status in capitals", () => {
  const item = newLenientDomainTemplate("code-801", "label-171");
  const view = toLenientDomainTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDomainTemplateViews([item, item]).length, 2, "views");
});
