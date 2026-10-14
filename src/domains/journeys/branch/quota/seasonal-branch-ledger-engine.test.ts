import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalBranchLedgerEngine } from "./seasonal-branch-ledger-engine.js";
import { newSeasonalBranchLedger } from "./seasonal-branch-ledger.js";

test("SeasonalBranchLedgerEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBranchLedgerEngine(flags.newRegistry());
  const item = newSeasonalBranchLedger("code-3", "name-293");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
