import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFrequencyProfileView, toStrictFrequencyProfileViews } from "./strict-frequency-profile-view.js";
import { newStrictFrequencyProfile } from "./strict-frequency-profile.js";

test("StrictFrequencyProfileView shows the status in capitals", () => {
  const item = newStrictFrequencyProfile("code-226", "title-525");
  const view = toStrictFrequencyProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFrequencyProfileViews([item, item]).length, 2, "views");
});
