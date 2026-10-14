import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFlightBundleView, toRollingFlightBundleViews } from "./rolling-flight-bundle-view.js";
import { newRollingFlightBundle } from "./rolling-flight-bundle.js";

test("RollingFlightBundleView shows the status in capitals", () => {
  const item = newRollingFlightBundle("code-216", "name-782");
  const view = toRollingFlightBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFlightBundleViews([item, item]).length, 2, "views");
});
