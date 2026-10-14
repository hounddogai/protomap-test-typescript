import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderExceptionView, toSenderExceptionViews } from "./sender-exception-view.js";
import { newSenderException } from "./sender-exception.js";

test("SenderExceptionView shows the status in capitals", () => {
  const item = newSenderException("code-843", "label-50");
  const view = toSenderExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderExceptionViews([item, item]).length, 2, "views");
});
