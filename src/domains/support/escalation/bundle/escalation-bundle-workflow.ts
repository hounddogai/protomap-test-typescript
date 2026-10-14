import * as clock from "../../../../kit/clock.js";
import { EscalationBundleValidator, defaultEscalationBundleValidator } from "./escalation-bundle-rules.js";
import { EscalationBundleStore } from "./escalation-bundle-store.js";

/** Moves escalation bundles through their life cycle and keeps a journal of what it did. */
export class EscalationBundleService {
  store: EscalationBundleStore;
  validator: EscalationBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: EscalationBundleStore,
    validator: EscalationBundleValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newEscalationBundleService(store: EscalationBundleStore, clockValue: clock.Clock): EscalationBundleService {
  return new EscalationBundleService(store, defaultEscalationBundleValidator(), clockValue, []);
}
