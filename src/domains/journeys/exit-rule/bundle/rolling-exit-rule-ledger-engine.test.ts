import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingExitRuleLedgerEngine } from "./rolling-exit-rule-ledger-engine.js";
import { newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

test("RollingExitRuleLedgerEngine keeps results within bounds", () => {
  const engine = defaultRollingExitRuleLedgerEngine(flags.newRegistry());
  const item = newRollingExitRuleLedger("code-831", "name-599");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
