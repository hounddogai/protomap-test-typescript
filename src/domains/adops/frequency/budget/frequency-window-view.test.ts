import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyWindowView, toFrequencyWindowViews } from "./frequency-window-view.js";
import { newFrequencyWindow } from "./frequency-window.js";

test("FrequencyWindowView shows the status in capitals", () => {
  const item = newFrequencyWindow("code-413", "title-309");
  const view = toFrequencyWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyWindowViews([item, item]).length, 2, "views");
});
