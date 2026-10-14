import * as clock from "../../../../kit/clock.js";
import { DefaultCsatTemplateValidator, defaultDefaultCsatTemplateValidator } from "./default-csat-template-rules.js";
import { DefaultCsatTemplateStore } from "./default-csat-template-store.js";

/** Moves default csat templates through their life cycle and keeps a journal of what it did. */
export class DefaultCsatTemplateCoordinator {
  store: DefaultCsatTemplateStore;
  validator: DefaultCsatTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultCsatTemplateStore,
    validator: DefaultCsatTemplateValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default csat template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default csat template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newDefaultCsatTemplateCoordinator(store: DefaultCsatTemplateStore, clockValue: clock.Clock): DefaultCsatTemplateCoordinator {
  return new DefaultCsatTemplateCoordinator(store, defaultDefaultCsatTemplateValidator(), clockValue, []);
}
