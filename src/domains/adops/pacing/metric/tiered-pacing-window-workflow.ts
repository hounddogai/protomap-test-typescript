import * as clock from "../../../../kit/clock.js";
import { TieredPacingWindowValidator, defaultTieredPacingWindowValidator } from "./tiered-pacing-window-rules.js";
import { TieredPacingWindowStore } from "./tiered-pacing-window-store.js";

/** Moves tiered pacing windows through their life cycle and keeps a journal of what it did. */
export class TieredPacingWindowService {
  store: TieredPacingWindowStore;
  validator: TieredPacingWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredPacingWindowStore,
    validator: TieredPacingWindowValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newTieredPacingWindowService(store: TieredPacingWindowStore, clockValue: clock.Clock): TieredPacingWindowService {
  return new TieredPacingWindowService(store, defaultTieredPacingWindowValidator(), clockValue, []);
}
