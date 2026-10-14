import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalConversionWindowView, toGlobalConversionWindowViews } from "./global-conversion-window-view.js";
import { newGlobalConversionWindow } from "./global-conversion-window.js";

test("GlobalConversionWindowView shows the status in capitals", () => {
  const item = newGlobalConversionWindow("code-930", "label-99");
  const view = toGlobalConversionWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalConversionWindowViews([item, item]).length, 2, "views");
});
