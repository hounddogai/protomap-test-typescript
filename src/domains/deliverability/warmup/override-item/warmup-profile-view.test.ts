import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupProfileView, toWarmupProfileViews } from "./warmup-profile-view.js";
import { newWarmupProfile } from "./warmup-profile.js";

test("WarmupProfileView shows the status in capitals", () => {
  const item = newWarmupProfile("code-940", "name-18");
  const view = toWarmupProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupProfileViews([item, item]).length, 2, "views");
});
