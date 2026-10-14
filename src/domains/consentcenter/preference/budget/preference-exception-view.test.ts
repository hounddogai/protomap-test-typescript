import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceExceptionView, toPreferenceExceptionViews } from "./preference-exception-view.js";
import { newPreferenceException } from "./preference-exception.js";

test("PreferenceExceptionView shows the status in capitals", () => {
  const item = newPreferenceException("code-371", "title-546");
  const view = toPreferenceExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceExceptionViews([item, item]).length, 2, "views");
});
