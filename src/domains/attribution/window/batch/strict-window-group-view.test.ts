import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictWindowGroupView, toStrictWindowGroupViews } from "./strict-window-group-view.js";
import { newStrictWindowGroup } from "./strict-window-group.js";

test("StrictWindowGroupView shows the status in capitals", () => {
  const item = newStrictWindowGroup("code-793", "label-130");
  const view = toStrictWindowGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictWindowGroupViews([item, item]).length, 2, "views");
});
