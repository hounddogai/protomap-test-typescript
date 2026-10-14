import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderBaselineView, toSenderBaselineViews } from "./sender-baseline-view.js";
import { newSenderBaseline } from "./sender-baseline.js";

test("SenderBaselineView shows the status in capitals", () => {
  const item = newSenderBaseline("code-292", "title-69");
  const view = toSenderBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderBaselineViews([item, item]).length, 2, "views");
});
