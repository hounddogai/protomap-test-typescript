import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveDeflectionWindowView,
  toAdaptiveDeflectionWindowViews,
} from "./adaptive-deflection-window-view.js";
import { newAdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

test("AdaptiveDeflectionWindowView shows the status in capitals", () => {
  const item = newAdaptiveDeflectionWindow("code-854", "title-588");
  const view = toAdaptiveDeflectionWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDeflectionWindowViews([item, item]).length, 2, "views");
});
