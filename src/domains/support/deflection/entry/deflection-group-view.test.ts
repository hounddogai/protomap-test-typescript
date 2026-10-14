import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionGroupView, toDeflectionGroupViews } from "./deflection-group-view.js";
import { newDeflectionGroup } from "./deflection-group.js";

test("DeflectionGroupView shows the status in capitals", () => {
  const item = newDeflectionGroup("code-217", "title-389");
  const view = toDeflectionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionGroupViews([item, item]).length, 2, "views");
});
