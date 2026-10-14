import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingWindowGroupView, toRollingWindowGroupViews } from "./rolling-window-group-view.js";
import { newRollingWindowGroup } from "./rolling-window-group.js";

test("RollingWindowGroupView shows the status in capitals", () => {
  const item = newRollingWindowGroup("code-754", "title-153");
  const view = toRollingWindowGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingWindowGroupViews([item, item]).length, 2, "views");
});
