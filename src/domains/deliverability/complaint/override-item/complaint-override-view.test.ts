import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintOverrideView, toComplaintOverrideViews } from "./complaint-override-view.js";
import { newComplaintOverride } from "./complaint-override.js";

test("ComplaintOverrideView shows the status in capitals", () => {
  const item = newComplaintOverride("code-66", "label-113");
  const view = toComplaintOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintOverrideViews([item, item]).length, 2, "views");
});
