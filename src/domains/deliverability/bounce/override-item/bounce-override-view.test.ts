import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceOverrideView, toBounceOverrideViews } from "./bounce-override-view.js";
import { newBounceOverride } from "./bounce-override.js";

test("BounceOverrideView shows the status in capitals", () => {
  const item = newBounceOverride("code-546", "title-899");
  const view = toBounceOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceOverrideViews([item, item]).length, 2, "views");
});
