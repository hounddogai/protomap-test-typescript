import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientMentionBudgetEngine } from "./lenient-mention-budget-engine.js";
import { newLenientMentionBudget } from "./lenient-mention-budget.js";

test("LenientMentionBudgetEngine keeps results within bounds", () => {
  const engine = defaultLenientMentionBudgetEngine(flags.newRegistry());
  const item = newLenientMentionBudget("code-861", "title-451");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
