import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientJourneyGroupView, toLenientJourneyGroupViews } from "./lenient-journey-group-view.js";
import { newLenientJourneyGroup } from "./lenient-journey-group.js";

test("LenientJourneyGroupView shows the status in capitals", () => {
  const item = newLenientJourneyGroup("code-559", "title-866");
  const view = toLenientJourneyGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientJourneyGroupViews([item, item]).length, 2, "views");
});
