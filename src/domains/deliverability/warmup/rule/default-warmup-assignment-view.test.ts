import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultWarmupAssignmentView, toDefaultWarmupAssignmentViews } from "./default-warmup-assignment-view.js";
import { newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("DefaultWarmupAssignmentView shows the status in capitals", () => {
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  const view = toDefaultWarmupAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultWarmupAssignmentViews([item, item]).length, 2, "views");
});
