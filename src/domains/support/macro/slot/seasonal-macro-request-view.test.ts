import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalMacroRequestView, toSeasonalMacroRequestViews } from "./seasonal-macro-request-view.js";
import { newSeasonalMacroRequest } from "./seasonal-macro-request.js";

test("SeasonalMacroRequestView shows the status in capitals", () => {
  const item = newSeasonalMacroRequest("code-857", "name-647");
  const view = toSeasonalMacroRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalMacroRequestViews([item, item]).length, 2, "views");
});
