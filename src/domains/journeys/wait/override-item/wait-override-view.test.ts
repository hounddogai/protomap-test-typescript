import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitOverrideView, toWaitOverrideViews } from "./wait-override-view.js";
import { newWaitOverride } from "./wait-override.js";

test("WaitOverrideView shows the status in capitals", () => {
  const item = newWaitOverride("code-957", "label-450");
  const view = toWaitOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitOverrideViews([item, item]).length, 2, "views");
});
