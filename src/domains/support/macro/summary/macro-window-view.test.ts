import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroWindowView, toMacroWindowViews } from "./macro-window-view.js";
import { newMacroWindow } from "./macro-window.js";

test("MacroWindowView shows the status in capitals", () => {
  const item = newMacroWindow("code-925", "label-496");
  const view = toMacroWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroWindowViews([item, item]).length, 2, "views");
});
