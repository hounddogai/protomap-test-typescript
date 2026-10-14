import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualStreakExceptionView, toManualStreakExceptionViews } from "./manual-streak-exception-view.js";
import { newManualStreakException } from "./manual-streak-exception.js";

test("ManualStreakExceptionView shows the status in capitals", () => {
  const item = newManualStreakException("code-428", "name-397");
  const view = toManualStreakExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualStreakExceptionViews([item, item]).length, 2, "views");
});
