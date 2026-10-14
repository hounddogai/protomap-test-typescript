import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintProfileView, toComplaintProfileViews } from "./complaint-profile-view.js";
import { newComplaintProfile } from "./complaint-profile.js";

test("ComplaintProfileView shows the status in capitals", () => {
  const item = newComplaintProfile("code-438", "title-507");
  const view = toComplaintProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintProfileViews([item, item]).length, 2, "views");
});
