import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint override is in its life cycle. */
export type TieredTouchpointOverrideStatus = "created" | "validated" | "published" | "retired";

/** One tiered touchpoint override, with what the planners need to act on it. */
export class TieredTouchpointOverride {
  code: string;
  label: string;
  score: number;
  source: string;
  country: string;
  status: TieredTouchpointOverrideStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    source: string,
    country: string,
    status: TieredTouchpointOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.source = source;
    this.country = country;
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

  canMoveTo(next: TieredTouchpointOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: TieredTouchpointOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered touchpoint override"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TieredTouchpointOverride {
    return new TieredTouchpointOverride(this.code, this.label, this.score, this.source, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered touchpoint override in status created. */
export function newTieredTouchpointOverride(code: string, label: string): TieredTouchpointOverride {
  return new TieredTouchpointOverride(code, label, 0, "", "", "created");
}
