import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupGroupView, toWarmupGroupViews } from "./warmup-group-view.js";
import { newWarmupGroup } from "./warmup-group.js";

test("WarmupGroupView shows the status in capitals", () => {
  const item = newWarmupGroup("code-664", "title-707");
  const view = toWarmupGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupGroupViews([item, item]).length, 2, "views");
});
