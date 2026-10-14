import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceExceptionView, toBounceExceptionViews } from "./bounce-exception-view.js";
import { newBounceException } from "./bounce-exception.js";

test("BounceExceptionView shows the status in capitals", () => {
  const item = newBounceException("code-621", "label-325");
  const view = toBounceExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceExceptionViews([item, item]).length, 2, "views");
});
