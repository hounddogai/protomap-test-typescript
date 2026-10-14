import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalMacroOverrideView, toGlobalMacroOverrideViews } from "./global-macro-override-view.js";
import { newGlobalMacroOverride } from "./global-macro-override.js";

test("GlobalMacroOverrideView shows the status in capitals", () => {
  const item = newGlobalMacroOverride("code-194", "label-578");
  const view = toGlobalMacroOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalMacroOverrideViews([item, item]).length, 2, "views");
});
