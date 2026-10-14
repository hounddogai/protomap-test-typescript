import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictActivationExceptionView,
  toStrictActivationExceptionViews,
} from "./strict-activation-exception-view.js";
import { newStrictActivationException } from "./strict-activation-exception.js";

test("StrictActivationExceptionView shows the status in capitals", () => {
  const item = newStrictActivationException("code-594", "name-517");
  const view = toStrictActivationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictActivationExceptionViews([item, item]).length, 2, "views");
});
