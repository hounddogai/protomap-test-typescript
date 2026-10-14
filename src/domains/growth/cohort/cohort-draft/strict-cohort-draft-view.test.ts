import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCohortDraftView, toStrictCohortDraftViews } from "./strict-cohort-draft-view.js";
import { newStrictCohortDraft } from "./strict-cohort-draft.js";

test("StrictCohortDraftView shows the status in capitals", () => {
  const item = newStrictCohortDraft("code-765", "label-179");
  const view = toStrictCohortDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCohortDraftViews([item, item]).length, 2, "views");
});
