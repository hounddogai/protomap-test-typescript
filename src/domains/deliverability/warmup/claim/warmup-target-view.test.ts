import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupTargetView, toWarmupTargetViews } from "./warmup-target-view.js";
import { newWarmupTarget } from "./warmup-target.js";

test("WarmupTargetView shows the status in capitals", () => {
  const item = newWarmupTarget("code-734", "title-894");
  const view = toWarmupTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupTargetViews([item, item]).length, 2, "views");
});
