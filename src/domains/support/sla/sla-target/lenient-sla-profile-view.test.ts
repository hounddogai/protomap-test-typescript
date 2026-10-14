import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientSlaProfileView, toLenientSlaProfileViews } from "./lenient-sla-profile-view.js";
import { newLenientSlaProfile } from "./lenient-sla-profile.js";

test("LenientSlaProfileView shows the status in capitals", () => {
  const item = newLenientSlaProfile("code-210", "name-188");
  const view = toLenientSlaProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSlaProfileViews([item, item]).length, 2, "views");
});
