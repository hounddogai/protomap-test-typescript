import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryNudgeOverrideView, toPrimaryNudgeOverrideViews } from "./primary-nudge-override-view.js";
import { newPrimaryNudgeOverride } from "./primary-nudge-override.js";

test("PrimaryNudgeOverrideView shows the status in capitals", () => {
  const item = newPrimaryNudgeOverride("code-22", "label-779");
  const view = toPrimaryNudgeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryNudgeOverrideViews([item, item]).length, 2, "views");
});
