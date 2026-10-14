import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultCohortTemplateView, toDefaultCohortTemplateViews } from "./default-cohort-template-view.js";
import { newDefaultCohortTemplate } from "./default-cohort-template.js";

test("DefaultCohortTemplateView shows the status in capitals", () => {
  const item = newDefaultCohortTemplate("code-863", "name-508");
  const view = toDefaultCohortTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCohortTemplateViews([item, item]).length, 2, "views");
});
