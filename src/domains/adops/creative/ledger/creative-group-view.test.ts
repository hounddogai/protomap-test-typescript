import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeGroupView, toCreativeGroupViews } from "./creative-group-view.js";
import { newCreativeGroup } from "./creative-group.js";

test("CreativeGroupView shows the status in capitals", () => {
  const item = newCreativeGroup("code-97", "title-599");
  const view = toCreativeGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeGroupViews([item, item]).length, 2, "views");
});
