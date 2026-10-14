import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFlightDraftView, toLenientFlightDraftViews } from "./lenient-flight-draft-view.js";
import { newLenientFlightDraft } from "./lenient-flight-draft.js";

test("LenientFlightDraftView shows the status in capitals", () => {
  const item = newLenientFlightDraft("code-989", "name-686");
  const view = toLenientFlightDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFlightDraftViews([item, item]).length, 2, "views");
});
