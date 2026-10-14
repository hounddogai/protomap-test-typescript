import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyGroupView, toJourneyGroupViews } from "./journey-group-view.js";
import { newJourneyGroup } from "./journey-group.js";

test("JourneyGroupView shows the status in capitals", () => {
  const item = newJourneyGroup("code-358", "title-517");
  const view = toJourneyGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyGroupViews([item, item]).length, 2, "views");
});
