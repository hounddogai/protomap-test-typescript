import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaGroupView, toSlaGroupViews } from "./sla-group-view.js";
import { newSlaGroup } from "./sla-group.js";

test("SlaGroupView shows the status in capitals", () => {
  const item = newSlaGroup("code-799", "title-736");
  const view = toSlaGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaGroupViews([item, item]).length, 2, "views");
});
