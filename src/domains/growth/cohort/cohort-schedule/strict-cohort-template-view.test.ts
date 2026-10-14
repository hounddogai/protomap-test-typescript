import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCohortTemplateView, toStrictCohortTemplateViews } from "./strict-cohort-template-view.js";
import { newStrictCohortTemplate } from "./strict-cohort-template.js";

test("StrictCohortTemplateView shows the status in capitals", () => {
  const item = newStrictCohortTemplate("code-787", "name-786");
  const view = toStrictCohortTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCohortTemplateViews([item, item]).length, 2, "views");
});
