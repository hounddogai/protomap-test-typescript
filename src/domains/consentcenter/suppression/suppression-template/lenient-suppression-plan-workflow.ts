import * as clock from "../../../../kit/clock.js";
import {
  LenientSuppressionPlanValidator,
  defaultLenientSuppressionPlanValidator,
} from "./lenient-suppression-plan-rules.js";
import { LenientSuppressionPlanStore } from "./lenient-suppression-plan-store.js";

/** Moves lenient suppression plans through their life cycle and keeps a journal of what it did. */
export class LenientSuppressionPlanDesk {
  store: LenientSuppressionPlanStore;
  validator: LenientSuppressionPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientSuppressionPlanStore,
    validator: LenientSuppressionPlanValidator,
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
      throw new Error(`lenient suppression plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient suppression plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newLenientSuppressionPlanDesk(store: LenientSuppressionPlanStore, clockValue: clock.Clock): LenientSuppressionPlanDesk {
  return new LenientSuppressionPlanDesk(store, defaultLenientSuppressionPlanValidator(), clockValue, []);
}
