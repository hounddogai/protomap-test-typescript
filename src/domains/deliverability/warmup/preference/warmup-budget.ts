import * as text from "../../../../kit/text.js";

/** Where a warmup budget is in its life cycle. */
export type WarmupBudgetStatus = "created" | "validated" | "published" | "retired";

/** The record of a warmup budget and its current status. */
export class WarmupBudget {
  code: string;
  label: string;
  campaignRef: string;
  channel: string;
  visible: boolean;
  revision: number;
  status: WarmupBudgetStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    channel: string,
    visible: boolean,
    revision: number,
    status: WarmupBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.visible = visible;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WarmupBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): WarmupBudget {
    return new WarmupBudget(
      this.code,
      this.label,
      this.campaignRef,
      this.channel,
      this.visible,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a warmup budget in status created. */
export function newWarmupBudget(code: string, label: string): WarmupBudget {
  return new WarmupBudget(code, label, "", "", false, 0, "created");
}
