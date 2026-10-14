import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBounceGroupView, toAdaptiveBounceGroupViews } from "./adaptive-bounce-group-view.js";
import { newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

test("AdaptiveBounceGroupView shows the status in capitals", () => {
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  const view = toAdaptiveBounceGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBounceGroupViews([item, item]).length, 2, "views");
});
