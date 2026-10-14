import * as text from "../../../../kit/text.js";

/** Where a warmup group is in its life cycle. */
export type WarmupGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One warmup group, with what the planners need to act on it. */
export class WarmupGroup {
  code: string;
  title: string;
  ratio: number;
  margin: number;
  openRate: number;
  amount: number;
  updatedAt: number;
  status: WarmupGroupStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    margin: number,
    openRate: number,
    amount: number,
    updatedAt: number,
    status: WarmupGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.margin = margin;
    this.openRate = openRate;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.ratio + this.updatedAt) * 100) / 100;
  }

  copy(): WarmupGroup {
    return new WarmupGroup(
      this.code,
      this.title,
      this.ratio,
      this.margin,
      this.openRate,
      this.amount,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup group in status planned. */
export function newWarmupGroup(code: string, title: string): WarmupGroup {
  return new WarmupGroup(code, title, 0, 0, 0, 0, 0, "planned");
}
