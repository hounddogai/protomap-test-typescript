import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCreativeLedgerEngine } from "./seasonal-creative-ledger-engine.js";
import { newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("SeasonalCreativeLedgerEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCreativeLedgerEngine(flags.newRegistry());
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
