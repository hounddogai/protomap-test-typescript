import * as clock from "../../../../kit/clock.js";
import {
  LegacyTicketViewSummaryEngine,
  defaultLegacyTicketViewSummaryEngine,
} from "./legacy-ticket-view-summary-engine.js";
import {
  LegacyTicketViewSummaryValidator,
  defaultLegacyTicketViewSummaryValidator,
} from "./legacy-ticket-view-summary-rules.js";
import { LegacyTicketViewSummaryStore } from "./legacy-ticket-view-summary-store.js";

/** Moves legacy ticket view summaries through their life cycle and keeps a journal of what it did. */
export class LegacyTicketViewSummaryService {
  store: LegacyTicketViewSummaryStore;
  validator: LegacyTicketViewSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyTicketViewSummaryEngine;

  constructor(
    store: LegacyTicketViewSummaryStore,
    validator: LegacyTicketViewSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyTicketViewSummaryEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view summary ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyTicketViewSummaryService(store: LegacyTicketViewSummaryStore, clockValue: clock.Clock): LegacyTicketViewSummaryService {
  return new LegacyTicketViewSummaryService(
    store,
    defaultLegacyTicketViewSummaryValidator(),
    clockValue,
    [],
    defaultLegacyTicketViewSummaryEngine(),
  );
}
