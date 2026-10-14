import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryInsightLedgerEngine } from "./primary-insight-ledger-engine.js";
import { newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("PrimaryInsightLedgerEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInsightLedgerEngine(flags.newRegistry());
  const item = newPrimaryInsightLedger("code-448", "name-551");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
