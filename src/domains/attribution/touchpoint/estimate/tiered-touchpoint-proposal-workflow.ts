import * as clock from "../../../../kit/clock.js";
import {
  TieredTouchpointProposalValidator,
  defaultTieredTouchpointProposalValidator,
} from "./tiered-touchpoint-proposal-rules.js";
import { TieredTouchpointProposalStore } from "./tiered-touchpoint-proposal-store.js";

/** Moves tiered touchpoint proposals through their life cycle and keeps a journal of what it did. */
export class TieredTouchpointProposalService {
  store: TieredTouchpointProposalStore;
  validator: TieredTouchpointProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredTouchpointProposalStore,
    validator: TieredTouchpointProposalValidator,
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
      throw new Error(`tiered touchpoint proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered touchpoint proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newTieredTouchpointProposalService(store: TieredTouchpointProposalStore, clockValue: clock.Clock): TieredTouchpointProposalService {
  return new TieredTouchpointProposalService(store, defaultTieredTouchpointProposalValidator(), clockValue, []);
}
