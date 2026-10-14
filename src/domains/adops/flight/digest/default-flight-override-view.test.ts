import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFlightOverrideView, toDefaultFlightOverrideViews } from "./default-flight-override-view.js";
import { newDefaultFlightOverride } from "./default-flight-override.js";

test("DefaultFlightOverrideView shows the status in capitals", () => {
  const item = newDefaultFlightOverride("code-751", "name-876");
  const view = toDefaultFlightOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFlightOverrideViews([item, item]).length, 2, "views");
});
