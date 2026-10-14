import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionRequestView, toDeflectionRequestViews } from "./deflection-request-view.js";
import { newDeflectionRequest } from "./deflection-request.js";

test("DeflectionRequestView shows the status in capitals", () => {
  const item = newDeflectionRequest("code-636", "label-506");
  const view = toDeflectionRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionRequestViews([item, item]).length, 2, "views");
});
