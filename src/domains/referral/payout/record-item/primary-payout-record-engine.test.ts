import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPayoutRecordEngine } from "./primary-payout-record-engine.js";
import { newPrimaryPayoutRecord } from "./primary-payout-record.js";

test("PrimaryPayoutRecordEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPayoutRecordEngine(flags.newRegistry());
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
