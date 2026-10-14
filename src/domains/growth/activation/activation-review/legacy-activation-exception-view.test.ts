import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyActivationExceptionView,
  toLegacyActivationExceptionViews,
} from "./legacy-activation-exception-view.js";
import { newLegacyActivationException } from "./legacy-activation-exception.js";

test("LegacyActivationExceptionView shows the status in capitals", () => {
  const item = newLegacyActivationException("code-95", "name-661");
  const view = toLegacyActivationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyActivationExceptionViews([item, item]).length, 2, "views");
});
