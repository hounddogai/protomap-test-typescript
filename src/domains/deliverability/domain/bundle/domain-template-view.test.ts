import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainTemplateView, toDomainTemplateViews } from "./domain-template-view.js";
import { newDomainTemplate } from "./domain-template.js";

test("DomainTemplateView shows the status in capitals", () => {
  const item = newDomainTemplate("code-453", "label-311");
  const view = toDomainTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainTemplateViews([item, item]).length, 2, "views");
});
