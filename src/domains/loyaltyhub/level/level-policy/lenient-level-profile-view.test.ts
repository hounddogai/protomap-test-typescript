import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientLevelProfileView, toLenientLevelProfileViews } from "./lenient-level-profile-view.js";
import { newLenientLevelProfile } from "./lenient-level-profile.js";

test("LenientLevelProfileView shows the status in capitals", () => {
  const item = newLenientLevelProfile("code-846", "name-875");
  const view = toLenientLevelProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLevelProfileViews([item, item]).length, 2, "views");
});
