import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWaitExceptionView, toLegacyWaitExceptionViews } from "./legacy-wait-exception-view.js";
import { newLegacyWaitException } from "./legacy-wait-exception.js";

test("LegacyWaitExceptionView shows the status in capitals", () => {
  const item = newLegacyWaitException("code-782", "name-923");
  const view = toLegacyWaitExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWaitExceptionViews([item, item]).length, 2, "views");
});
