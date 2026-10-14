import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalStepDraftView, toSeasonalStepDraftViews } from "./seasonal-step-draft-view.js";
import { newSeasonalStepDraft } from "./seasonal-step-draft.js";

test("SeasonalStepDraftView shows the status in capitals", () => {
  const item = newSeasonalStepDraft("code-53", "name-231");
  const view = toSeasonalStepDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalStepDraftViews([item, item]).length, 2, "views");
});
