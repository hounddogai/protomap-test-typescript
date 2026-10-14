import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitGroupView, toWaitGroupViews } from "./wait-group-view.js";
import { newWaitGroup } from "./wait-group.js";

test("WaitGroupView shows the status in capitals", () => {
  const item = newWaitGroup("code-626", "title-128");
  const view = toWaitGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitGroupViews([item, item]).length, 2, "views");
});
