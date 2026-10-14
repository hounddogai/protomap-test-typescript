import * as text from "../../../../kit/text.js";

/** Where a tiered funnel summary is in its life cycle. */
export type TieredFunnelSummaryStatus = "created" | "validated" | "published" | "retired";

/** One tiered funnel summary, with what the planners need to act on it. */
export class TieredFunnelSummary {
  code: string;
  name: string;
  retries: number;
  durationMinutes: number;
  visible: boolean;
  status: TieredFunnelSummaryStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    durationMinutes: number,
    visible: boolean,
    status: TieredFunnelSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
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

  canMoveTo(next: TieredFunnelSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: TieredFunnelSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered funnel summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round(this.durationMinutes * this.retries * 100) / 100;
  }

  copy(): TieredFunnelSummary {
    return new TieredFunnelSummary(this.code, this.name, this.retries, this.durationMinutes, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered funnel summary in status created. */
export function newTieredFunnelSummary(code: string, name: string): TieredFunnelSummary {
  return new TieredFunnelSummary(code, name, 0, 0, false, "created");
}
