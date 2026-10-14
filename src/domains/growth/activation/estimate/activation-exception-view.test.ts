import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationExceptionView, toActivationExceptionViews } from "./activation-exception-view.js";
import { newActivationException } from "./activation-exception.js";

test("ActivationExceptionView shows the status in capitals", () => {
  const item = newActivationException("code-460", "name-307");
  const view = toActivationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationExceptionViews([item, item]).length, 2, "views");
});
