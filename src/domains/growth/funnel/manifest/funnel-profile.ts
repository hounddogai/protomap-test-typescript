import * as text from "../../../../kit/text.js";

/** Where a funnel profile is in its life cycle. */
export type FunnelProfileStatus = "created" | "validated" | "published" | "retired";

/** One funnel profile, with what the planners need to act on it. */
export class FunnelProfile {
  code: string;
  title: string;
  windowDays: number;
  margin: number;
  limit: number;
  label: string;
  status: FunnelProfileStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    margin: number,
    limit: number,
    label: string,
    status: FunnelProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.margin = margin;
    this.limit = limit;
    this.label = label;
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

  canMoveTo(next: FunnelProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"funnel profile"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.margin * this.windowDays * 100) / 100;
  }

  copy(): FunnelProfile {
    return new FunnelProfile(this.code, this.title, this.windowDays, this.margin, this.limit, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel profile in status created. */
export function newFunnelProfile(code: string, title: string): FunnelProfile {
  return new FunnelProfile(code, title, 0, 0, 0, "", "created");
}
