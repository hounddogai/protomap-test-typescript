import * as text from "../../../../kit/text.js";

/** Where a global credit estimate is in its life cycle. */
export type GlobalCreditEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global credit estimate, with what the planners need to act on it. */
export class GlobalCreditEstimate {
  code: string;
  name: string;
  channel: string;
  ratio: number;
  ownerId: string;
  description: string;
  status: GlobalCreditEstimateStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    ratio: number,
    ownerId: string,
    description: string,
    status: GlobalCreditEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalCreditEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalCreditEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global credit estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): GlobalCreditEstimate {
    return new GlobalCreditEstimate(
      this.code,
      this.name,
      this.channel,
      this.ratio,
      this.ownerId,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global credit estimate in status idle. */
export function newGlobalCreditEstimate(code: string, name: string): GlobalCreditEstimate {
  return new GlobalCreditEstimate(code, name, "", 0, "", "", "idle");
}
