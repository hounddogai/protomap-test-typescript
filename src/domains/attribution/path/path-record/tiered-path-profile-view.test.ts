import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPathProfileView, toTieredPathProfileViews } from "./tiered-path-profile-view.js";
import { newTieredPathProfile } from "./tiered-path-profile.js";

test("TieredPathProfileView shows the status in capitals", () => {
  const item = newTieredPathProfile("code-773", "label-899");
  const view = toTieredPathProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPathProfileViews([item, item]).length, 2, "views");
});
