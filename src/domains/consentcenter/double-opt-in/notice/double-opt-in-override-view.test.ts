import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInOverrideView, toDoubleOptInOverrideViews } from "./double-opt-in-override-view.js";
import { newDoubleOptInOverride } from "./double-opt-in-override.js";

test("DoubleOptInOverrideView shows the status in capitals", () => {
  const item = newDoubleOptInOverride("code-132", "name-307");
  const view = toDoubleOptInOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInOverrideViews([item, item]).length, 2, "views");
});
