import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryTierRecordEngine } from "./primary-tier-record-engine.js";
import { newPrimaryTierRecord } from "./primary-tier-record.js";

test("PrimaryTierRecordEngine keeps results within bounds", () => {
  const engine = defaultPrimaryTierRecordEngine(flags.newRegistry());
  const item = newPrimaryTierRecord("code-667", "title-407");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
