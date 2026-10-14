import * as text from "../../../../kit/text.js";

/** Where a creative group is in its life cycle. */
export type CreativeGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A creative group as the creative team keeps it. */
export class CreativeGroup {
  code: string;
  title: string;
  weight: number;
  limit: number;
  ceiling: number;
  externalRef: string;
  status: CreativeGroupStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    limit: number,
    ceiling: number,
    externalRef: string,
    status: CreativeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.limit = limit;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
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

  canMoveTo(next: CreativeGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"creative group"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.ceiling + this.weight) * 100) / 100;
  }

  copy(): CreativeGroup {
    return new CreativeGroup(
      this.code,
      this.title,
      this.weight,
      this.limit,
      this.ceiling,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a creative group in status idle. */
export function newCreativeGroup(code: string, title: string): CreativeGroup {
  return new CreativeGroup(code, title, 0, 0, 0, "", "idle");
}
