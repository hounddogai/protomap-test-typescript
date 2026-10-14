import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowGroupView, toWindowGroupViews } from "./window-group-view.js";
import { newWindowGroup } from "./window-group.js";

test("WindowGroupView shows the status in capitals", () => {
  const item = newWindowGroup("code-637", "name-579");
  const view = toWindowGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowGroupViews([item, item]).length, 2, "views");
});
