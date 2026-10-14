/**
 * Command deliverabilityctl runs deliverability's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildSenderSegmentReport } from "../../domains/deliverability/sender/segment/sender-segment-report.js";
import { newMemorySenderSegmentStore } from "../../domains/deliverability/sender/segment/sender-segment-store.js";
import { newSenderSegmentCoordinator } from "../../domains/deliverability/sender/segment/sender-segment-workflow.js";
import { newSenderSegment } from "../../domains/deliverability/sender/segment/sender-segment.js";
import { buildWarmupBundleReport } from "../../domains/deliverability/warmup/batch/warmup-bundle-report.js";
import { newMemoryWarmupBundleStore } from "../../domains/deliverability/warmup/batch/warmup-bundle-store.js";
import { newWarmupBundleManager } from "../../domains/deliverability/warmup/batch/warmup-bundle-workflow.js";
import { newWarmupBundle } from "../../domains/deliverability/warmup/batch/warmup-bundle.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["sender-segment", (): boolean => {
      const store = newMemorySenderSegmentStore();
      for (let index = 0; index < 3; index++) {
        store.save(newSenderSegment(`sender-segment-${index}`, `Sample sender segment ${index}`));
      }
      const flow = newSenderSegmentCoordinator(store, clockValue, flags.newRegistry());
      try {
        flow.open("sender-segment-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildSenderSegmentReport("Sender Segment", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["warmup-bundle", (): boolean => {
      const store = newMemoryWarmupBundleStore();
      for (let index = 0; index < 10; index++) {
        store.save(newWarmupBundle(`warmup-bundle-${index}`, `Sample warmup bundle ${index}`));
      }
      const flow = newWarmupBundleManager(store, clockValue);
      try {
        flow.open("warmup-bundle-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildWarmupBundleReport("Warmup Bundle", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
  ]);
  let failed = 0;
  for (const name of [...commands.keys()].sort()) {
    const command = commands.get(name)!;
    if (!command()) {
      console.log(`${name} failed`);
      failed += 1;
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main();
