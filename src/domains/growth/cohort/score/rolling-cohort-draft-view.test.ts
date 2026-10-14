import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCohortDraftView, toRollingCohortDraftViews } from "./rolling-cohort-draft-view.js";
import { newRollingCohortDraft } from "./rolling-cohort-draft.js";

test("RollingCohortDraftView shows the status in capitals", () => {
  const item = newRollingCohortDraft("code-607", "name-825");
  const view = toRollingCohortDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCohortDraftViews([item, item]).length, 2, "views");
});
