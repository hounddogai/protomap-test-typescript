import * as clock from "../../../../kit/clock.js";
import {
  PendingFraudCheckExceptionValidator,
  defaultPendingFraudCheckExceptionValidator,
} from "./pending-fraud-check-exception-rules.js";
import { PendingFraudCheckExceptionStore } from "./pending-fraud-check-exception-store.js";

/** Moves pending fraud check exceptions through their life cycle and keeps a journal of what it did. */
export class PendingFraudCheckExceptionService {
  store: PendingFraudCheckExceptionStore;
  validator: PendingFraudCheckExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingFraudCheckExceptionStore,
    validator: PendingFraudCheckExceptionValidator,
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
      throw new Error(`pending fraud check exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending fraud check exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newPendingFraudCheckExceptionService(store: PendingFraudCheckExceptionStore, clockValue: clock.Clock): PendingFraudCheckExceptionService {
  return new PendingFraudCheckExceptionService(store, defaultPendingFraudCheckExceptionValidator(), clockValue, []);
}
