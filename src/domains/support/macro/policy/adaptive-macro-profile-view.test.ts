import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveMacroProfileView, toAdaptiveMacroProfileViews } from "./adaptive-macro-profile-view.js";
import { newAdaptiveMacroProfile } from "./adaptive-macro-profile.js";

test("AdaptiveMacroProfileView shows the status in capitals", () => {
  const item = newAdaptiveMacroProfile("code-40", "title-26");
  const view = toAdaptiveMacroProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveMacroProfileViews([item, item]).length, 2, "views");
});
