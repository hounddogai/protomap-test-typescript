import * as text from "../../../../kit/text.js";

/** Where a wait rollup is in its life cycle. */
export type WaitRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A wait rollup as the wait team keeps it. */
export class WaitRollup {
  code: string;
  title: string;
  approved: boolean;
  ceiling: number;
  archived: boolean;
  clicks: number;
  tags: string[];
  status: WaitRollupStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    ceiling: number,
    archived: boolean,
    clicks: number,
    tags: string[],
    status: WaitRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.ceiling = ceiling;
    this.archived = archived;
    this.clicks = clicks;
    this.tags = tags;
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

  canMoveTo(next: WaitRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.clicks + this.ceiling) * 100) / 100;
  }

  copy(): WaitRollup {
    return new WaitRollup(
      this.code,
      this.title,
      this.approved,
      this.ceiling,
      this.archived,
      this.clicks,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait rollup in status planned. */
export function newWaitRollup(code: string, title: string): WaitRollup {
  return new WaitRollup(code, title, false, 0, false, 0, [], "planned");
}
