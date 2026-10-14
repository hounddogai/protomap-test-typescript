import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchExceptionView, toBranchExceptionViews } from "./branch-exception-view.js";
import { newBranchException } from "./branch-exception.js";

test("BranchExceptionView shows the status in capitals", () => {
  const item = newBranchException("code-338", "name-592");
  const view = toBranchExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchExceptionViews([item, item]).length, 2, "views");
});
