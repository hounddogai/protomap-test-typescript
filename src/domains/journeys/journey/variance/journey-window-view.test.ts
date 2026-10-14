import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyWindowView, toJourneyWindowViews } from "./journey-window-view.js";
import { newJourneyWindow } from "./journey-window.js";

test("JourneyWindowView shows the status in capitals", () => {
  const item = newJourneyWindow("code-948", "name-753");
  const view = toJourneyWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyWindowViews([item, item]).length, 2, "views");
});
