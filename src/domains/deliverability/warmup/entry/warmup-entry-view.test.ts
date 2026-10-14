import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupEntryView, toWarmupEntryViews } from "./warmup-entry-view.js";
import { newWarmupEntry } from "./warmup-entry.js";

test("WarmupEntryView shows the status in capitals", () => {
  const item = newWarmupEntry("code-721", "title-771");
  const view = toWarmupEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupEntryViews([item, item]).length, 2, "views");
});
