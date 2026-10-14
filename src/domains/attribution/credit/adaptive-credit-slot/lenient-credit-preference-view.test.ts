import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCreditPreferenceView, toLenientCreditPreferenceViews } from "./lenient-credit-preference-view.js";
import { newLenientCreditPreference } from "./lenient-credit-preference.js";

test("LenientCreditPreferenceView shows the status in capitals", () => {
  const item = newLenientCreditPreference("code-968", "title-759");
  const view = toLenientCreditPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCreditPreferenceViews([item, item]).length, 2, "views");
});
