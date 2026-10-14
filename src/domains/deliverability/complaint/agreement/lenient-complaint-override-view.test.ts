import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientComplaintOverrideView,
  toLenientComplaintOverrideViews,
} from "./lenient-complaint-override-view.js";
import { newLenientComplaintOverride } from "./lenient-complaint-override.js";

test("LenientComplaintOverrideView shows the status in capitals", () => {
  const item = newLenientComplaintOverride("code-820", "name-154");
  const view = toLenientComplaintOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientComplaintOverrideViews([item, item]).length, 2, "views");
});
