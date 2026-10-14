import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingExceptionView, toPacingExceptionViews } from "./pacing-exception-view.js";
import { newPacingException } from "./pacing-exception.js";

test("PacingExceptionView shows the status in capitals", () => {
  const item = newPacingException("code-91", "title-810");
  const view = toPacingExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingExceptionViews([item, item]).length, 2, "views");
});
