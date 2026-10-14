import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalTicketViewRecordEngine } from "./regional-ticket-view-record-engine.js";
import { newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("RegionalTicketViewRecordEngine keeps results within bounds", () => {
  const engine = defaultRegionalTicketViewRecordEngine(flags.newRegistry());
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
