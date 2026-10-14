import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictReputationExceptionView,
  toStrictReputationExceptionViews,
} from "./strict-reputation-exception-view.js";
import { newStrictReputationException } from "./strict-reputation-exception.js";

test("StrictReputationExceptionView shows the status in capitals", () => {
  const item = newStrictReputationException("code-375", "name-546");
  const view = toStrictReputationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictReputationExceptionViews([item, item]).length, 2, "views");
});
