import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveDoubleOptInExceptionView,
  toAdaptiveDoubleOptInExceptionViews,
} from "./adaptive-double-opt-in-exception-view.js";
import { newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

test("AdaptiveDoubleOptInExceptionView shows the status in capitals", () => {
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  const view = toAdaptiveDoubleOptInExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDoubleOptInExceptionViews([item, item]).length, 2, "views");
});
