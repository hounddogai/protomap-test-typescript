import * as clock from "../../../../kit/clock.js";
import { SeasonalModelAuditValidator, defaultSeasonalModelAuditValidator } from "./seasonal-model-audit-rules.js";
import { SeasonalModelAuditStore } from "./seasonal-model-audit-store.js";

/** Moves seasonal model audits through their life cycle and keeps a journal of what it did. */
export class SeasonalModelAuditCoordinator {
  store: SeasonalModelAuditStore;
  validator: SeasonalModelAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalModelAuditStore,
    validator: SeasonalModelAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal model audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal model audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalModelAuditCoordinator(store: SeasonalModelAuditStore, clockValue: clock.Clock): SeasonalModelAuditCoordinator {
  return new SeasonalModelAuditCoordinator(store, defaultSeasonalModelAuditValidator(), clockValue, []);
}
