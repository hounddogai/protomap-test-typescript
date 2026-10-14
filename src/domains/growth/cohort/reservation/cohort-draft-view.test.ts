import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortDraftView, toCohortDraftViews } from "./cohort-draft-view.js";
import { newCohortDraft } from "./cohort-draft.js";

test("CohortDraftView shows the status in capitals", () => {
  const item = newCohortDraft("code-348", "title-200");
  const view = toCohortDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortDraftViews([item, item]).length, 2, "views");
});
