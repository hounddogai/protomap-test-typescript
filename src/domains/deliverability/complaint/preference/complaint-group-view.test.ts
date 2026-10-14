import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintGroupView, toComplaintGroupViews } from "./complaint-group-view.js";
import { newComplaintGroup } from "./complaint-group.js";

test("ComplaintGroupView shows the status in capitals", () => {
  const item = newComplaintGroup("code-278", "name-881");
  const view = toComplaintGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintGroupViews([item, item]).length, 2, "views");
});
