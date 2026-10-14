import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPostOverrideView, toStrictPostOverrideViews } from "./strict-post-override-view.js";
import { newStrictPostOverride } from "./strict-post-override.js";

test("StrictPostOverrideView shows the status in capitals", () => {
  const item = newStrictPostOverride("code-287", "name-266");
  const view = toStrictPostOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPostOverrideViews([item, item]).length, 2, "views");
});
