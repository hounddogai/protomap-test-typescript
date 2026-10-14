import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveOptOutProfileView, toAdaptiveOptOutProfileViews } from "./adaptive-opt-out-profile-view.js";
import { newAdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

test("AdaptiveOptOutProfileView shows the status in capitals", () => {
  const item = newAdaptiveOptOutProfile("code-838", "name-878");
  const view = toAdaptiveOptOutProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveOptOutProfileViews([item, item]).length, 2, "views");
});
