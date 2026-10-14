import * as text from "../../../../kit/text.js";

/** Where a funnel summary is in its life cycle. */
export type FunnelSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A funnel summary. Its code is unique within a tenant. */
export class FunnelSummary {
  code: string;
  name: string;
  contactEmail: string;
  durationMinutes: number;
  budget: number;
  status: FunnelSummaryStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    durationMinutes: number,
    budget: number,
    status: FunnelSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FunnelSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round(this.durationMinutes * this.budget * 100) / 100;
  }

  copy(): FunnelSummary {
    return new FunnelSummary(this.code, this.name, this.contactEmail, this.durationMinutes, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel summary in status new. */
export function newFunnelSummary(code: string, name: string): FunnelSummary {
  return new FunnelSummary(code, name, "", 0, 0, "new");
}
