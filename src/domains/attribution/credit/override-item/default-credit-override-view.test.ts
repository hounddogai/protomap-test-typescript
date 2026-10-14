import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultCreditOverrideView, toDefaultCreditOverrideViews } from "./default-credit-override-view.js";
import { newDefaultCreditOverride } from "./default-credit-override.js";

test("DefaultCreditOverrideView shows the status in capitals", () => {
  const item = newDefaultCreditOverride("code-244", "title-602");
  const view = toDefaultCreditOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCreditOverrideViews([item, item]).length, 2, "views");
});
