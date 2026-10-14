import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleExceptionView, toExitRuleExceptionViews } from "./exit-rule-exception-view.js";
import { newExitRuleException } from "./exit-rule-exception.js";

test("ExitRuleExceptionView shows the status in capitals", () => {
  const item = newExitRuleException("code-51", "name-595");
  const view = toExitRuleExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleExceptionViews([item, item]).length, 2, "views");
});
