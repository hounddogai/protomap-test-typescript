import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeOverrideView, toNudgeOverrideViews } from "./nudge-override-view.js";
import { newNudgeOverride } from "./nudge-override.js";

test("NudgeOverrideView shows the status in capitals", () => {
  const item = newNudgeOverride("code-434", "title-247");
  const view = toNudgeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeOverrideViews([item, item]).length, 2, "views");
});
