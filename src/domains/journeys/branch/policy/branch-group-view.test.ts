import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchGroupView, toBranchGroupViews } from "./branch-group-view.js";
import { newBranchGroup } from "./branch-group.js";

test("BranchGroupView shows the status in capitals", () => {
  const item = newBranchGroup("code-988", "title-339");
  const view = toBranchGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchGroupViews([item, item]).length, 2, "views");
});
