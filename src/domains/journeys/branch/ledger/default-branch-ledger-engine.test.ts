import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultBranchLedgerEngine } from "./default-branch-ledger-engine.js";
import { newDefaultBranchLedger } from "./default-branch-ledger.js";

test("DefaultBranchLedgerEngine keeps results within bounds", () => {
  const engine = defaultDefaultBranchLedgerEngine(flags.newRegistry());
  const item = newDefaultBranchLedger("code-481", "title-183");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
