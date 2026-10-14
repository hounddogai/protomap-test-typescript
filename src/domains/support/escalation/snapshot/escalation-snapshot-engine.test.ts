import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationSnapshotEngine } from "./escalation-snapshot-engine.js";
import { newEscalationSnapshot } from "./escalation-snapshot.js";

test("EscalationSnapshotEngine keeps results within bounds", () => {
  const engine = defaultEscalationSnapshotEngine(flags.newRegistry());
  const item = newEscalationSnapshot("code-253", "title-272");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
