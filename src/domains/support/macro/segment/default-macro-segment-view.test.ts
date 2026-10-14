import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultMacroSegmentView, toDefaultMacroSegmentViews } from "./default-macro-segment-view.js";
import { newDefaultMacroSegment } from "./default-macro-segment.js";

test("DefaultMacroSegmentView shows the status in capitals", () => {
  const item = newDefaultMacroSegment("code-511", "label-787");
  const view = toDefaultMacroSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMacroSegmentViews([item, item]).length, 2, "views");
});
