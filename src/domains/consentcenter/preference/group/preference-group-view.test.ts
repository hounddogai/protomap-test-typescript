import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceGroupView, toPreferenceGroupViews } from "./preference-group-view.js";
import { newPreferenceGroup } from "./preference-group.js";

test("PreferenceGroupView shows the status in capitals", () => {
  const item = newPreferenceGroup("code-719", "title-587");
  const view = toPreferenceGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceGroupViews([item, item]).length, 2, "views");
});
