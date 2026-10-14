import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledCreativeOverrideView,
  toScheduledCreativeOverrideViews,
} from "./scheduled-creative-override-view.js";
import { newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("ScheduledCreativeOverrideView shows the status in capitals", () => {
  const item = newScheduledCreativeOverride("code-889", "name-101");
  const view = toScheduledCreativeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledCreativeOverrideViews([item, item]).length, 2, "views");
});
