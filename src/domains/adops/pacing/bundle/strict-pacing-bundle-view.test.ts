import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPacingBundleView, toStrictPacingBundleViews } from "./strict-pacing-bundle-view.js";
import { newStrictPacingBundle } from "./strict-pacing-bundle.js";

test("StrictPacingBundleView shows the status in capitals", () => {
  const item = newStrictPacingBundle("code-578", "name-319");
  const view = toStrictPacingBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPacingBundleViews([item, item]).length, 2, "views");
});
