/**
 * Command supportctl runs support's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import { buildMacroSegmentReport } from "../../domains/support/macro/segment/macro-segment-report.js";
import { newMemoryMacroSegmentStore } from "../../domains/support/macro/segment/macro-segment-store.js";
import { newMacroSegmentService } from "../../domains/support/macro/segment/macro-segment-workflow.js";
import { newMacroSegment } from "../../domains/support/macro/segment/macro-segment.js";
import { buildTicketViewScoreReport } from "../../domains/support/ticket-view/score/ticket-view-score-report.js";
import { newMemoryTicketViewScoreStore } from "../../domains/support/ticket-view/score/ticket-view-score-store.js";
import { newTicketViewScoreWorkflow } from "../../domains/support/ticket-view/score/ticket-view-score-workflow.js";
import { newTicketViewScore } from "../../domains/support/ticket-view/score/ticket-view-score.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["macro-segment", (): boolean => {
      const store = newMemoryMacroSegmentStore();
      for (let index = 0; index < 7; index++) {
        store.save(newMacroSegment(`macro-segment-${index}`, `Sample macro segment ${index}`));
      }
      const flow = newMacroSegmentService(store, clockValue);
      try {
        flow.advance("macro-segment-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildMacroSegmentReport("Macro Segment", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["ticket-view-score", (): boolean => {
      const store = newMemoryTicketViewScoreStore();
      for (let index = 0; index < 11; index++) {
        store.save(newTicketViewScore(`ticket-view-score-${index}`, `Sample ticket view score ${index}`));
      }
      const flow = newTicketViewScoreWorkflow(store, clockValue);
      try {
        flow.start("ticket-view-score-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildTicketViewScoreReport("Ticket View Score", items, clockValue);
      console.log(report.render());
      return flow.audit(Math.floor(Date.now() / 1000)) >= 0;
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
