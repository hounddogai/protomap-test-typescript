import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleLedgerEngine } from "./exit-rule-ledger-engine.js";
import { newExitRuleLedger } from "./exit-rule-ledger.js";

test("ExitRuleLedgerEngine keeps results within bounds", () => {
  const engine = defaultExitRuleLedgerEngine(flags.newRegistry());
  const item = newExitRuleLedger("code-809", "title-918");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
