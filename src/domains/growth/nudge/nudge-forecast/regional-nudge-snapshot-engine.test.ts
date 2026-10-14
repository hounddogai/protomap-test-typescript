import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalNudgeSnapshotEngine } from "./regional-nudge-snapshot-engine.js";
import { newRegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

test("RegionalNudgeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRegionalNudgeSnapshotEngine(flags.newRegistry());
  const item = newRegionalNudgeSnapshot("code-132", "label-391");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
