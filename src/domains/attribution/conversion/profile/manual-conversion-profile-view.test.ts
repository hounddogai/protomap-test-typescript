import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualConversionProfileView, toManualConversionProfileViews } from "./manual-conversion-profile-view.js";
import { newManualConversionProfile } from "./manual-conversion-profile.js";

test("ManualConversionProfileView shows the status in capitals", () => {
  const item = newManualConversionProfile("code-982", "name-611");
  const view = toManualConversionProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualConversionProfileViews([item, item]).length, 2, "views");
});
